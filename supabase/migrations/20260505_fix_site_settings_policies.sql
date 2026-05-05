-- Allow authenticated users to insert new settings
CREATE POLICY "Allow authenticated to insert site_settings"
  ON site_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to delete settings if needed
CREATE POLICY "Allow authenticated to delete site_settings"
  ON site_settings FOR DELETE
  TO authenticated
  USING (true);
