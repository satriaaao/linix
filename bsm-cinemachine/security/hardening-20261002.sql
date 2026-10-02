-- Public pages never need member personal details or other visitors' sessions.
DO $$
DECLARE definition text;
BEGIN
  SELECT pg_get_functiondef('public.rentcam_member_lookup(text)'::regprocedure) INTO definition;
  definition := replace(definition, E'begin\n', E'begin\n  if not public.rentcam_is_admin() then return jsonb_build_object(''found'',false); end if;\n');
  EXECUTE definition;
END $$;
DROP POLICY IF EXISTS rentcam_presence_public_select ON public.rentcam_presence;
DROP POLICY IF EXISTS rentcam_presence_public_insert ON public.rentcam_presence;
DROP POLICY IF EXISTS rentcam_presence_public_update ON public.rentcam_presence;
CREATE OR REPLACE FUNCTION public.rentcam_record_presence(p_session text,p_path text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  IF length(p_session) NOT BETWEEN 16 AND 200 OR length(p_path)>500 OR p_path NOT LIKE '/%' THEN RETURN false; END IF;
  INSERT INTO public.rentcam_presence(session_id,path,last_seen) VALUES(p_session,split_part(p_path,'?',1),now())
  ON CONFLICT(session_id) DO UPDATE SET path=EXCLUDED.path,last_seen=now();
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.rentcam_record_presence(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rentcam_record_presence(text,text) TO anon,authenticated;
-- Shared login counters survive serverless instances; no plaintext passwords/IPs stored.
CREATE TABLE IF NOT EXISTS rentcam_private.login_limits(key text PRIMARY KEY,bucket timestamptz NOT NULL,attempts integer NOT NULL);
REVOKE ALL ON rentcam_private.login_limits FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION rentcam_private.admin_password_ok(p_password text)
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=rentcam_private,extensions,pg_temp AS $$
DECLARE h jsonb:=coalesce(current_setting('request.headers',true)::jsonb,'{}'::jsonb); k text; n integer;
BEGIN
  IF length(coalesce(p_password,'')) NOT BETWEEN 1 AND 1024 THEN RETURN false; END IF;
  k:=encode(extensions.digest(coalesce(nullif(h->>'cf-connecting-ip',''),nullif(h->>'x-real-ip',''),nullif(split_part(h->>'x-forwarded-for',',',1),''),'unknown'),'sha256'),'hex');
  INSERT INTO rentcam_private.login_limits(key,bucket,attempts) VALUES(k,date_trunc('minute',now()),1)
  ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN login_limits.bucket=date_trunc('minute',now()) THEN login_limits.attempts+1 ELSE 1 END,bucket=date_trunc('minute',now())
  RETURNING attempts INTO n;
  IF n>20 THEN RETURN false; END IF;
  DELETE FROM rentcam_private.login_limits WHERE bucket<now()-interval '1 day';
  RETURN EXISTS(SELECT 1 FROM rentcam_private.admin_auth a WHERE a.id=1 AND a.password_digest=extensions.crypt(encode(extensions.digest(p_password,'sha256'),'hex'),a.password_digest));
END $$;
DO $$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.rentcam_issue_admin_session()'::regprocedure) INTO definition;
 -- A false result commits failed-attempt counters; exceptions would roll them back.
 definition:=replace(definition, 'raise exception ''not authorized'';', 'return null;');
 EXECUTE definition;
END $$;
ALTER TABLE public.rentcam_reviews ADD CONSTRAINT reviews_input_limits CHECK(length(name) BETWEEN 2 AND 100 AND length(message) BETWEEN 5 AND 2000 AND kind IN ('review','feedback') AND (kind<>'review' OR rating BETWEEN 1 AND 5)) NOT VALID;
