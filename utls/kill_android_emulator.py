import subprocess
import sys
import os

def get_emulator_pids():
    """Return a list of PIDs for running Android emulator processes."""
    try:
        # List all processes containing 'emulator' in their command line
        result = subprocess.run(['ps', 'aux'], stdout=subprocess.PIPE, text=True)
        lines = result.stdout.splitlines()
        emulator_procs = []
        for line in lines:
            if 'emulator' in line and not 'grep' in line:
                parts = line.split()
                pid = int(parts[1])
                emulator_procs.append({'pid': pid, 'cmd': line})
        return emulator_procs
    except Exception as e:
        print(f"Error detecting emulator processes: {e}")
        return []

def kill_emulators():
    emulator_procs = get_emulator_pids()
    if not emulator_procs:
        print("No Android emulator processes found.")
        return
    print(f"Found {len(emulator_procs)} Android emulator process(es):")
    for proc in emulator_procs:
        print(f"  PID: {proc['pid']} | CMD: {proc['cmd']}")
    for proc in emulator_procs:
        try:
            print(f"Killing emulator process PID {proc['pid']}...")
            os.kill(proc['pid'], 9)
        except Exception as e:
            print(f"Failed to kill PID {proc['pid']}: {e}")

if __name__ == "__main__":
    kill_emulators()
