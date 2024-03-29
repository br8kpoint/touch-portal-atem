# Touch Portal Plugin To Control ATEM Switchers
![](https://img.shields.io/github/downloads/br8kpoint/touch-portal-atem/total)

- [Touch Portal Plugin to Control ATEM switchers](#touch-portal-plugin-to-control-atem-switchers)
  - [Description](#description)
  - [ChangeLog](#changelog)
  - [Goals](#goals)
  - [Intallation and Configuration](#installation-and-configuration)
  - [Usage](#usage)
    - [Button Press](#button-press)
    - [On Event](#on-event)
    - [States](#states)
  - [Roadmap](#roadmap)

## Description:
This is a Touch Portal plugin that will let you control the ATEM switchers. Right now it only has bi-directional scene switching on the program. **Latest Update** has support for ***macros***

## ChangeLog
```
v1.0.0 - First release
  Additions:
    - Action for Program Source Changes
    - State for Program Souce
    - Event for Program Souce
		- This is a convenience function to easily set up actions when the source changes. It's better to use the When Plugin State Changes for more flexibility
v1.1.0
  - Action for Run Macro
  - Action to toggle Macro loop
  - Action to Stop Macro
  - State for Atem Running Macro
    - This is the macro name
  - State for if ATEM MACRO IS RUNNING? (true/false)
  - State for ATEM MACRO LOOP? (true/false)
  
```


## Goals:

1. The original goal is to combine it with the use of OBS to create complex scene switching so that at the touch of a touch portal button, the source can be changed on the ATEM and the scene will be  switched to a specified scene in OBS

2. When the source on the ATEM is switched. The scene should also be switched in OBS. This works by using the event "When the ATEM source is x" under the plugin.

## Installation and Configuration

Configuration is done in Touch Portal as of version 2.3.0. using the built in settings mechanism.

1. Go to the Settings cog at the top right of the Touch Portal main window.
2. Select the Plugins page.
3. Select Plugin to control ATEM switchers from the list on that page.
4. Enter the ip address of your ATEM in the AtemIP box.

![Touch Portal ATEM Plugin Settings](Screenshots/TPAtemSettings.png)


## Touch Portal Setup


### Button Press

* Setup a button press using the action of "Set the source of the ATEM to x"

You can also combine it with other actions from OBS or any other TP action to do whatever you want!

Sample:

![Sample Touch Portal ATEM Source action](Screenshots/OnPress.png)

* Run a macro using the action of "Run Macro" and select the macro from the list.

Sample:

![Sample Touch Portal ATEM Run Macro action](Screenshots/RunMacro.png)

### On Event

Use "When the ATEM source is x" event to respond when a button is pressed on the atem. The sample below sets the OBS scene to a corresponding scene (at the bottom of the screenshot).

Sample:

![Sample Touch Portal ATEM OnEvent](Screenshots/OnEvent.png)

### States

![ATEM States](Screenshots/TPATEMStates.png)

* ATEM SOURCE - The current progtam souce selected on the atem
* ATEM RUNNING MACRO - The name of the currently running macro
* ATEM MACRO LOOP? - true/false value if the macro loop is enabled
* ATEM MACRO IS RUNNING? - true/false value if a macro is running

## Roadmap

The initial version only has bi-directional source changes on the program source. 

Other plans (need to learn more about how the ATEM works):

* split out program / preview actions and states
* create actions to set transition settings
* actions and states for picture in picture
* actions and events for upstream and downstream keying

Those are the things I see off the top of my head. I know there is a ton more that the ATEM can do

## Suuport

Use the issues for this repository.

Discuss how you use the plugin on discord https://discord.gg/e7g8MM2sKF

Feel free to fork and contribute.


