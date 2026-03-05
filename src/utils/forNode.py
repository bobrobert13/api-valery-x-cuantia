import pyodbc
from dotenv import dotenv_values

config = dotenv_values(".env")
connection = pyodbc.connect("""
    DRIVER={Firebird/InterBase(r) driver};
    CLIENT=C:/Program Files/Firebird/Firebird_2_5/bin/fbclient.dll;
    DATABASE=%(FIREBIRD_PYTHON)s;
    USER=%(FIREBIRD_USER)s;
    PASSWORD=%(FIREBIRD_PASSWORD)s
""" % config)


def runQuery(connection, query):
    cursor = connection.execute(query)
    rows = cursor.fetchall()
    cursor.commit()
    result = []
    parsedRow={}
    columns = [column[0] for column in cursor.description]
    for row in rows:
        listed = list(row)
        for i in range(len(listed)):
            col = listed[i]

            # print(columns[i],type(col))
            data = list(col) if type(col) == type(bytes()) else col
            
            parsedRow.setdefault(columns[i], data)
        result.append(parsedRow)
        parsedRow={}
    return result

import sys
import json

sql_string = sys.argv[1]


# Process SQL string and return data as JSON

row = runQuery(connection, sql_string)

json_data = json.dumps(row)

print(json_data)