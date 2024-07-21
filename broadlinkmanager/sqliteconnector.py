from loguru import logger
import sqlite3

class SqliteConnector:
    def __init__(self):
        self.db_path = "data/codes.db"
        self.conn = None
    # Connect to the SQLite database
    def open_connection(self):
        if self.conn is None:
            try:
                self.conn = sqlite3.connect(self.db_path)
                logger.info("Connection opened successfully.")
            except sqlite3.Error as e:
                logger.error(f"Error connecting to database: {e}")
        else:
            logger.debug("Connection is already open.")


    def close_connection(self):
        if self.conn is not None:
            self.conn.close()
            self.conn = None
            logger.info("Connection closed.")
        else:
            logger.info("No connection to close.")


    def create_tables(self):
        try:
            self.open_connection()
            cursor = self.conn.cursor()
            cursor.execute('''
                        CREATE TABLE IF NOT EXISTS Codes (
                            CodeId INTEGER PRIMARY KEY AUTOINCREMENT,
                            CodeType TEXT NOT NULL,
                            CodeName TEXT NOT NULL,
                            Code TEXT NOT NULL)
                        ''')

            self.conn.commit()
            self.close_connection()
            logger.info("Tables created successfully")
        except sqlite3.Error as e:
            logger.error(str(e))

    def execute_query(self, query, params=(),is_insert=False):
        self.open_connection()
        cursor = self.conn.cursor()
        cursor.execute(query, params)
        self.conn.commit()
        if is_insert:
            lastrowid = cursor.lastrowid
            self.close_connection()
            return lastrowid
        self.close_connection()


    # Inserts

    def insert_code(self, code_type, code_name, code):
        try:
            query = 'INSERT INTO Codes (CodeType, CodeName, Code) VALUES (?, ?, ?)'
            self.execute_query(query, (code_type, code_name, code))
            return {"message": "Code inserted successfully.","success":1}
        except Exception as e:
            logger.error(f"Failed to update the code. {str(e)}")
            return {"message": f"Failed to update the code. {str(e)}","success":0}

    # Updates

    def update_code(self, code_id, code_type=None, code_name=None, code=None):
        try:
            query = 'UPDATE Codes SET '
            params = []
            if code_type:
                query += 'CodeType=?, '
                params.append(code_type)
            if code_name:
                query += 'CodeName=?, '
                params.append(code_name)
            if code:
                query += 'Code=?, '
                params.append(code)
            query = query.rstrip(', ') + ' WHERE CodeId=?'
            params.append(code_id)
            self.execute_query(query, params)
            return {"message": "Code updated successfully.","success":1}
        except Exception as e:
            logger.error(f"Failed to update the code. {str(e)}")
            return {"message": f"Failed to update the code. {str(e)}","success":0}

    # Deletes

    def delete_code(self, code_id):
        try:
            query = 'DELETE FROM Codes WHERE CodeId = ?'
            self.execute_query(query, (code_id,))
            return {"message": "Code deleted successfully.","success":1}
        except Exception as e:
            logger.error(f"Failed to update the code. {str(e)}")
            return {"message": f"Failed to delete the code. {str(e)}","success":0}
    # Selects

    def select_code(self,code_id, api_call=True):
        try:
            logger.warning(code_id)
            self.open_connection()
            cursor = self.conn.cursor()
            cursor.execute(f"SELECT CodeId, CodeType, CodeName, Code FROM Codes where CodeId={code_id}")
            if api_call:
                rows = [dict((cursor.description[i][0], value) for i, value in enumerate(row)) for row in cursor.fetchall()]
                cursor.close()
                return rows
            else:
                rows = cursor.fetchall()
                cursor.close()
            return rows
        except Exception as e:
            logger.error(f"Failed to get the code. {str(e)}")
            return []
        finally:
            self.close_connection()

    def select_all_codes(self, api_call=True):
        try:
            self.open_connection()
            cursor = self.conn.cursor()
            cursor.execute('SELECT CodeId, CodeType, CodeName, Code FROM Codes')
            if api_call:
                rows = [dict((cursor.description[i][0], value) for i, value in enumerate(row)) for row in cursor.fetchall()]
                cursor.close()
                return rows
            else:
                rows = cursor.fetchall()
                cursor.close()
            return rows
        except Exception as e:
            logger.error(f"Failed to update the code. {str(e)}")
            return []
        finally:
            self.close_connection()