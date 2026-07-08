-- Rename default controller label to creator(0) for $ANSEMINDEX framing
UPDATE controller_wallets
SET label = 'creator(0)'
WHERE label = 'wallet(0)' OR label IS NULL OR label = '';
