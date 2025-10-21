-- Query to check the structure of the healthkit_samples table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'healthkit_samples' 
ORDER BY 
    ordinal_position;
