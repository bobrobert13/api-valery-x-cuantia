const { spawn } = require('child_process');


export function runSQLPython(sqlString) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [__dirname+"/forNode.py", sqlString]);
      let result = ""
      let killed = false
      pythonProcess.on("exit",()=>{
        if (!killed){
          resolve(JSON.parse(result.trim()))

        }
      })
      pythonProcess.stdout.on('data', (data) => {
        // resolve(data.toString());
        result += data.toString()
      });
  
      pythonProcess.stderr.on('data', (data) => {
        reject(data.toString())
      
      });
      setTimeout(()=>{
        killed = true
        reject ("python-timeout")
        pythonProcess.kill()
      },
      1000 * 2)
    });
  }