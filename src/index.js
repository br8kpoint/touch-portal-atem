const TouchPortalAPI = require('touchportal-api');

// Create an instance of the Touch Portal Client
const TPClient = new TouchPortalAPI.Client();

// Define a pluginId, matches your entry.tp file
const pluginId = 'TPATEMPlugin';
const objectPath = require("object-path");
const fs = require('fs');


let rawdata = fs.readFileSync('settings.json');
let settings = JSON.parse(rawdata);


const { Atem } = require('atem-connection')
const myAtem = new Atem();

myAtem.on('info', console.log)
myAtem.on('error', console.error)
 

 
myAtem.on('connected', () => {
    console.log("Atem connected")
    
})
 
myAtem.on('stateChanged', (state, pathToChange) => {
    console.log("atem state change:")
    //console.log(state) // catch the ATEM state.
    console.log(pathToChange);
    let programChange = pathToChange.filter(function(item){
        return item.indexOf("programInput") > 0;
    });
    if(programChange.length == 1){
        let newProgram = objectPath.get(state,programChange[0]);
        console.log("sending state to tp: ATEM_SOURCE = " + newProgram)
        let states=[
            {id: "ATEM_SOURCE", value: newProgram.toString()}
        ];
        TPClient.stateUpdateMany(states);  
        //TPClient.stateUpdate("ATEM_SOURCE", newProgram);
    }
    
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

//Connects and Pairs to Touch Portal via Sockete
TPClient.connect({ pluginId });