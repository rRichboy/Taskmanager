import psycopg2

conn = psycopg2.connect(
    dbname="Taskmanager",
    user="postgres",
    password="admin",
    host="localhost"
)


def get_db_connection():
    return psycopg2.connect(
        dbname="Taskmanager",
        user="postgres",
        password="admin",
        host="localhost"
    )
