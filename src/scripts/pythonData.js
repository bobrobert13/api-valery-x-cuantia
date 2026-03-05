const { spawn } = require('child_process');
import fs from "fs"

function runPythonScript(sqlString) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [__dirname + "/../utils/forNode.py", sqlString]);

    pythonProcess.stdout.on('data', (data) => {
      resolve(data.toString());
    });

    pythonProcess.stderr.on('data', (data) => {

    });
  });
}

runPythonScript("select nombre from productos_servicios")
  .then((result) => {
    // console.log("XD",result);
    let array = JSON.parse(result)
    console.log(array)
    for (const prod of array) {
      // console.log("prod",prod)
      const img = Buffer.from(prod.IMAGEN)
      fs.writeFileSync("xdxxdxd.png", img)
    }
  })
  .catch((error) => {
    console.error("NT", error);
  });

setTimeout(() => { }, 8000)