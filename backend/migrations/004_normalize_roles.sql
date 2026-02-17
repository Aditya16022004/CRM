UPDATE users
SET role = 'USER'
WHERE role IS NULL OR role NOT IN ('ADMIN', 'USER');

UPDATE admins
SET role = 'ADMIN'
WHERE role IS NULL OR role <> 'ADMIN';
