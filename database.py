import psycopg2
from psycopg2 import sql
import os
from dotenv import load_dotenv

# Carica le variabili dal file .env
load_dotenv()

# Ottieni i valori delle variabili di ambiente
db_settings = {
    'dbname': os.getenv('DB_NAME'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'host': os.getenv('DB_HOST'),
    'port': os.getenv('DB_PORT')
}

# Verifica i valori
print(db_settings)

# Establish a connection to PostgreSQL
def connect_db():
    try:
        connection = psycopg2.connect(**db_settings)
        connection.autocommit = True
        return connection
    except Exception as e:
        print(f"Error connecting to the database: {e}")
        return None

# Create Tables
def create_tables():
    commands = [
        """
        CREATE TABLE IF NOT EXISTS "User" (
            ID SERIAL PRIMARY KEY,
            NAME VARCHAR(100) NOT NULL,
            SURNAME VARCHAR(100) NOT NULL,
            EMAIL VARCHAR(255) UNIQUE NOT NULL,
            HASH_PASS VARCHAR(255) NOT NULL,
            WALLET VARCHAR(255),
            CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS Friends (
            USER_ID INT REFERENCES "User"(ID) ON DELETE CASCADE,
            FRIEND_ID INT REFERENCES "User"(ID) ON DELETE CASCADE,
            CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (USER_ID, FRIEND_ID)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS Ballot (
            ID SERIAL PRIMARY KEY,
            NAME VARCHAR(255) NOT NULL,
            DESCRIPTION TEXT,
            ID_CREATOR INT REFERENCES "User"(ID) ON DELETE CASCADE,
            START_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            END_DATE TIMESTAMP,
            CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS BallotVoters (
            ID_BALLOT INT REFERENCES Ballot(ID) ON DELETE CASCADE,
            ID_VOTER INT REFERENCES "User"(ID) ON DELETE CASCADE,
            CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (ID_BALLOT, ID_VOTER)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS Bookmark (
            ID_USER INT REFERENCES "User"(ID) ON DELETE CASCADE,
            ID_BALLOT INT REFERENCES Ballot(ID) ON DELETE CASCADE,
            CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (ID_USER, ID_BALLOT)
        )
        """
    ]

    connection = connect_db()
    if connection:
        cursor = connection.cursor()
        try:
            for command in commands:
                cursor.execute(command)
            print("Tables created successfully!")
        except Exception as e:
            print(f"Error creating tables: {e}")
        finally:
            cursor.close()
            connection.close()

if __name__ == '__main__':
    create_tables()
