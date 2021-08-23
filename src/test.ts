const { spawn } = require('child_process');

export function execPy(path: string) {
  //   fs.readdir(path, (err, list) => {
  //     console.log(list);
  //   });
  const child = spawn('python', [path, '/encode', '../photos/users/test2']);
  child.stdout.on('data', (data) => {
    console.log(`stdout: ${data.toString()}`);
  });

  child.stderr.on('data', (data) => {
    console.error(`stderr: ${data.toString()}`);
  });

  child.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
}
