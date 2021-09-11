const TouchPortalAPI = require('touchportal-api');

// Create an instance of the Touch Portal Client
const TPClient = new TouchPortalAPI.Client();

// Define a pluginId, matches your entry.tp file
const pluginId = 'TPATEMPlugin';
const objectPath = require("object-path");
const fs = require('fs');
let macroList = null;
let runningMacro = null;
// keep track of macroPlayer states
let bIsWaiting = false;
let bIsRunning = false;
let bMacroLoop = false;
/*let rawdata = fs.readFileSync('settings.json');
let settings = JSON.parse(rawdata);
*/

const { Atem } = require('atem-connection')
const myAtem = new Atem();

myAtem.on('info', console.log)
myAtem.on('error', console.error)
 

 
myAtem.on('connected', () => {
    console.log("Atem connected")
    macroList = BuildUsedMacros(myAtem.state);
    TPClient.choiceUpdate("availble_macros", macroList.map(function(item){return item.name;}))
    let states=[];
    //if(myAtem.state.macro.macroPlayer.isRunning){
        states.push({id:"ATEM_RUNNING_MACRO", value: myAtem.state.macro.macroProperties[myAtem.state.macro.macroPlayer.macroIndex] || ""});
        bIsRunning = myAtem.state.macro.macroPlayer.isRunning;
        bIsWaiting = myAtem.state.macro.macroPlayer.isWaiting;
        states.push({id:"ATEM_MACRO_IS_RUNNING", value:`${bIsRunning && !bIsWaiting}`});
    //}
    
    bMacroLoop = myAtem.state.macro.macroPlayer.loop;
    states.push({id:"ATEM_MACRO_LOOP", value:`${bMacroLoop}`})
    TPClient.stateUpdateMany(states);  
    //TPClient.choiceUpdate("ATEM_RUNNING_MACRO", macroList.map(function(item){return item.name;}))
})
function BuildUsedMacros(state){
    let usedMacros = [];
    for(let i = 0; i<100; i++){
        if(state.macro.macroProperties[i].isUsed){
            usedMacros.push({
                index:i,
                name: state.macro.macroProperties[i].name,
                description: state.macro.macroProperties[i].description
            })
        }
    }
    return usedMacros;
} 
myAtem.on('stateChanged', (state, pathsToChange) => {
    //macroList = BuildUsedMacros(state);
    console.log("atem state change:")
    console.log(state) // catch the ATEM state.
    console.log(pathsToChange);
    let states = [];
    // loop through each program change and update the plugin states appropriately
    let stateObj = {

    }
    for(programChange of pathsToChange){
        if(programChange.indexOf("programInput") > 0){
            //program change
            let newProgram = objectPath.get(state,programChange);
            console.log("sending state to tp: ATEM_SOURCE = " + newProgram)
            stateObj.ATEM_SOURCE = newProgram.toString();
        }
        if(programChange.indexOf("macroProperties") > 0){
            macroList = BuildUsedMacros(state);
            TPClient.choiceUpdate("availble_macros", macroList.map(function(item){return item.name;}));
        }
        if(programChange.indexOf("macroPlayer") > 0){
            //macroPlayer change
            let macro = objectPath.get(state,programChange);
            if(macro.isRunning){
                // start macro
                runningMacro = macroList.find((item)=>item.index == macro.macroIndex);
                console.log("sending state to tp: ATEM_RUNNING_MACRO = " + runningMacro.name)
                stateObj.ATEM_RUNNING_MACRO=runningMacro.name;
            }
            if(!macro.isRunning && !macro.isWaiting){
                //stop macro
                runningMacro = null;
                console.log("sending state to tp: ATEM_RUNNING_MACRO = " )
                stateObj.ATEM_RUNNING_MACRO = "";
            }
        }
    }
    for(prop in stateObj){
        states.push({id:prop,value:stateObj[prop]});
    }
    if(bMacroLoop != myAtem.state.macro.macroPlayer.loop){
        bMacroLoop = myAtem.state.macro.macroPlayer.loop;
        states.push({id:"ATEM_MACRO_LOOP",value:`${bMacroLoop}`})
    }
    if(bIsRunning != myAtem.state.macro.macroPlayer.isRunning || bIsWaiting != myAtem.state.macro.macroPlayer.isWaiting){
        bIsRunning = myAtem.state.macro.macroPlayer.isRunning;
        bIsWaiting = myAtem.state.macro.macroPlayer.isWaiting;
        states.push({id:"ATEM_MACRO_IS_RUNNING",value:`${bIsRunning && !bIsWaiting}`})        
    }
    
    if(states.length == 0) return; // no real states we care about so don't send the updates of the atem
    
    console.log(states);
    if(states.length > 0) TPClient.stateUpdateMany(states);  
    
})

// Dynamic Actions Documentation: https://www.touch-portal.com/api/index.php?section=dynamic-actions

// Receive an Action Call from Touch Portal
TPClient.on("Action", (data) => {

    //An action was triggered, handle it here
    /*
        {
            "type":"action",
            "pluginId":"id of the plugin",
            "actionId":"id of the action",
            "data": [
                {
                "id":"data object id",
                "value":"user specified data object value",
                },
                {
                "id":"data object id",
                "value":"user specified data object value",
                }
            ]
        }
    */
   console.log(data);
   if(data.actionId == "ATEM_SWITCH_SRC"){
       let newSource = parseInt(data.data[0].value);
        myAtem.changeProgramInput(newSource).then(() => {
            // Fired once the atem has acknowledged the command
            // Note: the state likely hasnt updated yet, but will follow shortly
            console.log('Program input set to ' + newSource);
            // Once your action is done, send a State Update back to Touch Portal
            let states=[
                {id: "ATEM_SOURCE", value: newSource}
            ];
            TPClient.stateUpdateMany(states);
               
        })
   }
   if(data.actionId == "ATEM_RUN_MACRO"){
        runningMacro = macroList.find((item)=>item.name == data.data[0].value);    
        if(!runningMacro){
            console.log(`Macro ${data.data[0].value} not found!`);
            return;
        }
        myAtem.macroRun(runningMacro.index).then(() => {
            // Fired once the atem has acknowledged the command
            // Note: the state likely hasnt updated yet, but will follow shortly
            console.log(`Started running macro ${runningMacro.name}`);
            // Once your action is done, send a State Update back to Touch Portal
            let states=[
                {id: "ATEM_RUNNING_MACRO", value: runningMacro.name},
                {id:"ATEM_MACRO_IS_RUNNING", value: `${!myAtem.state.macro.macroPlayer.isWaiting}`}
            ];
            TPClient.stateUpdateMany(states);
                
        })
    }
    if(data.actionId == "ATEM_PAUSE_MACRO"){
        console.log("Received pause macro...")
        if(!runningMacro){
            console.log("No Running macro. Doing nothing...");
            return;
        }
        let func = null;
        if(myAtem.state.macro.macroPlayer.isRunning){
            console.log("Pausing macro...")
            myAtem.macroStop().then(()=>{
                bIsRunning = myAtem.state.macro.macroPlayer.isRunning;
                bIsWaiting = myAtem.state.macro.macroPlayer.isWaiting;
                let states=[
                    {id:"ATEM_MACRO_IS_RUNNING", value: `${bIsRunning && !bIsWaiting}`}
                ];
                TPClient.stateUpdateMany(states);
            });
        }
        else{
            console.log("Resuming macro...")
            myAtem.macroContinue().then(()=>{
                let states=[
                    {id: "ATEM_RUNNING_MACRO", value: runningMacro.name},
                    {id:"ATEM_MACRO_IS_RUNNING", value: `${myAtem.state.macro.macroPlayer.isRunning}`}
                ];
                TPClient.stateUpdateMany(states);
            })
        }
    }  
    if(data.actionId == "ATEM_TOGGLE_MACRO_LOOP"){
        console.log("Recieved set macro loop...")
        myAtem.macroSetLoop(!myAtem.state.macro.macroPlayer.loop).then(()=>{
            let states=[
                {id:"ATEM_MACRO_LOOP", value: `${myAtem.state.macro.macroPlayer.loop}`}
            ];
            TPClient.stateUpdateMany(states);
        })
    }     
});

TPClient.on("ListChange",(data) => {
    // An Action's List dropdown changed, handle it here
    /*
        {
            "type":"listChange",
            "pluginId":"id of the plugin",
            "actionId":"id of the action",
            "listId":"id of the list being used in the inline action",
            "instanceId":"id of the instance",
            "value":"newValue",
        }
    */

   

   // Now send choiceUpdateSpecific based on listChange value
   //TPClient.choiceUpdateSpecific("<state id>","value",data.instanceId)

});

// After join to Touch Portal, it sends an info message
// handle it here
TPClient.on("Info",(data) => {
    //console.log(data);
    return;
    //Do something with the Info message here
    /*
        {
            "type":"info",
            "sdkVersion":"(SDK version code)"
            "tpVersionString":"(Version of Touch Portal in string format)"
            "tpVersionCode":"(Version of Touch Portal in code format)"
            "pluginVersion":"(Your plug-in version)"
        }
    */

    // Read some data about your program or interface, and update the choice list in Touch Portal
        // find AtemIP and connect atem

    let atem_found = false;

    for(i=0;i <data.settings.length; i++){

        for(const prop in data.settings[i]){

            if(prop == "AtemIP"){
                console.log("Connectiong to atem on "+ data.settings[i][prop] + "...");
                myAtem.connect(data.settings[i][prop]);

                atem_found = true;

                break;

            }

        }

        if(atem_found) break;

    }
    //TPClient.choiceUpdate("<state id>",["choice1","choice2"]);

    // Dynamic State additions - for use when you want control over what states are available in TouchPortal
    //TPClient.createState("<new state id>","Description","Default Value");

});

TPClient.on("Settings",(data) => {

    //Do something with the Settings message here
    // Note: this can be called any time settings are modified or saved in the TouchPortal Settings window.
    /* 
      [{"Setting 1":"Value 1"},{"Setting 2":"Value 2"},...,{"Setting N":"Value N"}]
    */
   //console.log(data);
    console.log("Received new settings...");
    // find AtemIP and connect atem

    let atem_found = false;

    for(i=0;i <data.length; i++){

        for(const prop in data[i]){

            if(prop == "AtemIP"){
                console.log("Connectiong to atem on "+ data[i][prop] + "...");
                myAtem.connect(data[i][prop]);

                atem_found = true;

                break;

            }

        }

        if(atem_found) break;

    }
});

TPClient.on("Update", (curVersion, newVersion) => {
    console.log(`current:${curVersion}, new:${newVersion}`)
  });

//Connects and Pairs to Touch Portal via Sockete
TPClient.connect({ pluginId });