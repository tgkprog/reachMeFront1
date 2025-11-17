#!/usr/bin/env python3
"""Kill lingering Jest/e2e or Node servers bound to specific ports.

Matches processes by either:
    - Command markers (jest, entities.e2e.test, tests/e2e, --runTestsByPath)
    - Listeners bound to given TCP port(s)

Defaults:
    - Ports: 8082 (test server) and 8081 (app server) if none are provided

Usage:
    # Dry-run listing (no kill)
    python scripts/kill.py
    python scripts/kill.py --port 8081

    # Actually terminate
    python scripts/kill.py --kill                 # uses default ports 8082,8081
    python scripts/kill.py -p 8081 --kill         # target only 8081
    python scripts/kill.py -p 8082 -p 8083 --kill # multiple ports
"""
import subprocess
import os
import signal
import sys
import time
import argparse
import re

MARKERS = ["jest", "entities.e2e.test", "tests/e2e", "--runTestsByPath"]
DEFAULT_PORTS = [8082, 8081]


def _ps_cmd(pid: int) -> str:
    try:
        return subprocess.check_output(["ps", "-p", str(pid), "-o", "cmd=\n"], text=True).strip()
    except subprocess.CalledProcessError:
        return ""


def list_listeners_on_port(port: int):
    """Return list of (pid, cmd) for processes listening on TCP port."""
    results = []
    seen = set()
    # Try lsof first for simpler parsing
    try:
        out = subprocess.check_output(
            ["lsof", "-i", f":{port}", "-sTCP:LISTEN", "-n", "-P"], text=True, stderr=subprocess.DEVNULL
        )
        lines = out.strip().splitlines()
        for line in lines[1:]:  # skip header
            parts = line.split()
            if len(parts) >= 2 and parts[1].isdigit():
                pid = int(parts[1])
                if pid not in seen:
                    seen.add(pid)
                    cmd = _ps_cmd(pid)
                    results.append((pid, cmd or parts[0]))
    except Exception:
        # Fallback to ss if lsof not available
        try:
            out = subprocess.check_output(["ss", "-ltnp"], text=True)
            for line in out.splitlines():
                if f":{port} " in line or line.strip().endswith(f":{port}"):
                    # Extract pid=NNN using regex
                    m = re.search(r"pid=(\d+)", line)
                    if m:
                        pid = int(m.group(1))
                        if pid not in seen:
                            seen.add(pid)
                            cmd = _ps_cmd(pid)
                            results.append((pid, cmd or ""))
        except Exception:
            pass
    return results


def list_processes(ports=None):
    ports = ports or []
    if not ports:
        ports = DEFAULT_PORTS[:]  # copy defaults
    out = subprocess.check_output(["ps", "-eo", "pid,cmd"], text=True)
    lines = out.strip().splitlines()[1:]
    by_pid = {}
    # Marker-based matches
    for line in lines:
        try:
            pid_str, cmd = line.strip().split(maxsplit=1)
        except ValueError:
            continue
        pid = int(pid_str)
        lower = cmd.lower()
        if any(m.lower() in lower for m in MARKERS):
            by_pid[pid] = cmd

    # Port-based matches
    for port in ports:
        for pid, cmd in list_listeners_on_port(int(port)):
            if pid not in by_pid:
                by_pid[pid] = cmd

    # Exclude self
    me = os.getpid()
    if me in by_pid:
        by_pid.pop(me, None)
    return [(pid, by_pid[pid]) for pid in sorted(by_pid.keys())]


def process_alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def kill_processes(pids):
    failed = []
    for pid, cmd in pids:
        try:
            print(f"SIGTERM {pid} :: {cmd}")
            os.kill(pid, signal.SIGTERM)
        except ProcessLookupError:
            continue
        except PermissionError:
            failed.append(pid)
    time.sleep(1)
    for pid, cmd in pids:
        if process_alive(pid):
            try:
                print(f"SIGKILL {pid} :: {cmd}")
                os.kill(pid, signal.SIGKILL)
            except Exception:
                failed.append(pid)
    return failed


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Kill Jest/e2e or Node listeners on specified ports.")
    parser.add_argument("-p", "--port", dest="ports", action="append",
                        help="Port(s) to target; can be repeated or comma-separated")
    parser.add_argument("--kill", action="store_true",
                        help="Send SIGTERM then SIGKILL if still alive")
    args = parser.parse_args()

    ports = []
    if args.ports:
        for item in args.ports:
            for tok in str(item).split(','):
                tok = tok.strip()
                if not tok:
                    continue
                try:
                    ports.append(int(tok))
                except ValueError:
                    print(f"Warning: ignoring non-numeric port '{tok}'")

    procs = list_processes(ports=ports)
    if not procs:
        print("No matching processes found.")
        sys.exit(0)
    print("Matched processes:")
    for pid, cmd in procs:
        print(f"  {pid}\t{cmd}")
    if args.kill:
        failed = kill_processes(procs)
        if failed:
            print("Some PIDs could not be killed:", failed)
            sys.exit(2)
        print("All matching processes terminated.")
    else:
        print("(Dry run) Re-run with --kill to terminate them.")
