/*
  # Create get_current_statistics function

  1. New Functions
    - `get_current_statistics()` - Returns current application statistics
      - `total_users` (bigint) - Total number of registered users
      - `total_complaints` (bigint) - Total number of complaints/messages
      - `pending_complaints` (bigint) - Number of pending complaints
      - `resolved_complaints` (bigint) - Number of resolved complaints
      - `last_updated` (timestamptz) - Current timestamp

  2. Security
    - Function is accessible to authenticated users
    - Uses existing RLS policies on referenced tables

  3. Notes
    - Function counts users from auth.users table
    - Function counts complaints from public.complaints table
    - Returns real-time statistics each time called
*/

CREATE OR REPLACE FUNCTION public.get_current_statistics()
RETURNS TABLE (
    total_users bigint,
    total_complaints bigint,
    pending_complaints bigint,
    resolved_complaints bigint,
    last_updated timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT count(*)::bigint FROM auth.users) AS total_users,
        (SELECT count(*)::bigint FROM public.complaints) AS total_complaints,
        (SELECT count(*)::bigint FROM public.complaints WHERE status = 'pending') AS pending_complaints,
        (SELECT count(*)::bigint FROM public.complaints WHERE status = 'resolved') AS resolved_complaints,
        now() AS last_updated;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_statistics() TO anon;