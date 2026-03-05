import odbc from "odbc"
async function init() {
  const connection = odbc.connect({
    connectionString: `DRIVER={Firebird/InterBase(r) driver};
        CLIENT=C:/Program Files/Firebird/Firebird_2_5/bin/fbclient.dll;
        DATABASE=SERVER:C:\\Sistema\\ValeryCuantia\\Datos\\VALERY3.mdf;
        USER=${process.env.FIREBIRD_USER};
        PASSWORD=${process.env.FIREBIRD_PASSWORD}`
  }, (error, connection) => {
    if (error) {
      console.error(error);
      return;
    }
    connection.query("SELECT NOMBRE FROM productos_terminados where codigo_producto like '%O-001'", (error, result) => {
      if (error) {
        console.error("xd", error)
        return;
      }

      console.log("result ado", result.count)
      console.log("Asd", result[1])
    })

    console.log('Connected successfully!');
  });
}

init()