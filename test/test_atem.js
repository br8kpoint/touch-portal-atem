/* Used for testing atem functions */

const { Atem } = require('atem-connection')
const myAtem = new Atem();
const tpdata = null;
const objectPath = require("object-path");
let settings = require("../settings.json")
myAtem.on('info', console.log)
myAtem.on('error', console.error)
 
myAtem.connect(settings.atem_ip)
 
myAtem.on('connected', () => {
    myAtem.changeProgramInput(3).then(() => {
        // Fired once the atem has acknowledged the command
        // Note: the state likely hasnt updated yet, but will follow shortly
        console.log('Program input set')
    })
    console.log(myAtem.state)
})

myAtem.on('stateChanged', (state, pathToChange) => {
    console.log("atem state:")
    console.log(state) // catch the ATEM state.
    console.log(pathToChange)
    pathToChange.forEach(function(item){
        console.log(item+":");
        console.log(objectPath.get(state, item));
    })
    console.log("sending state to tp:")
    //TPClient.stateUpdate("ATEM_SOURCE", state, data.InstanceId);
})
