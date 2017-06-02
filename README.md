# NodeJSMessaging
Allow jailbroken IOS 10 devices to view and send text/imessages from a web browser.

## What you will need
  1. Nodejs installed on your desktop
  2. SSH enabled on your ios device
  3. sqlite3.x installed on ios device
  4. CLSMS installed on ios device from https:// s1ris.github.io/repo
## Current features
1. view messages
2. send messages
3. Free?

## Setup
just fill out the config file with the appropriate ip addresses and password.

## extra setup
if you want the messages to refresh on your desktop when you recieve a message you can use activator to run this command whenever you recieve a message.
curl -X POST computersIPAdress:3000 -m 1
