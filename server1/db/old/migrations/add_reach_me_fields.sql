-- Add new fields to reach_me_messages table for tracking delivery and auto-deactivation

ALTER TABLE reach_me_messages
ADD COLUMN reached_client BOOLEAN DEFAULT FALSE AFTER is_ack_all,
ADD COLUMN sent_details JSON AFTER reached_client,
ADD COLUMN auto_deactivate_at TIMESTAMP NULL AFTER sent_details,
ADD INDEX idx_reached_client (reached_client),
ADD INDEX idx_auto_deactivate (auto_deactivate_at);
