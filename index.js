const http = require('http');
const PORT = Number(process.argv[2] || 8500);
const child_process = require('child_process')

const Routes = {
  BATTERY: /\/battery\/?/
}

const Status = {
  NOT_FOUND: 404,
  NOT_FOUND_MSG: '404 - Resourse not found',
  OK: 200,
  OK_MSG: '200 - Success',
  BATTERY_ERROR: '500',
  BATTERY_ERROR_MEG: '500 - Battery Error'
}


const switchConfigForCurrentOS = () => {
  switch (process.platform) {
    case 'linux':
      return {
        command : 'upower -i /org/freedesktop/UPower/devices/battery_BAT0 | grep -E "state|time to empty|to full|percentage"'
      };
    case 'darwin':
      return {
        command: 'pmset -g batt | egrep "([0-9]+\%).*" -o',
      };
    case 'win32':
      return{
        command: 'WMIC Path Win32_Battery',
      };
    default:
      return{
        command:'',
      }
  }
};


const getBatteryStatus = (response, config) => {
  child_process.exec(config.command, (err, stdout, stderr) => {
    if(err){
      console.log('child_process failed ' + err.code);
      renderResult(response, {
        status: Status.BATTERY_ERROR,
        message: stderr
      });
    }else{
      renderResult(response, {
        status: Status.OK,
        data: stdout
      });
    }
  });
}




const renderResult = (response, data) => {
  response.writeHead(data.status, {'Content-type': 'application/json'});
  response.write(JSON.stringify(data));
  response.end();
};

const server = http.createServer((request, response)=>{
  const requestURL = request.url;
  const config = switchConfigForCurrentOS();
  console.log(requestURL);

  if(Routes.BATTERY.test(requestURL)){
    console.log('This is our battery');
    getBatteryStatus(response, config);
  }else{
    console.log('wrong route');
    renderResult(response, {
      status: Status.NOT_FOUND,
      message: Status.NOT_FOUND_MSG
    });
  }
}).listen(PORT);

console.log('Server running on port ' + PORT);
