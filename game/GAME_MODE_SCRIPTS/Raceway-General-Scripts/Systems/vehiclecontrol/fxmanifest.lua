-- ReaperAC | Do not touch this
shared_script "@ReaperAC/reaper-nwds22ojonydaz91p2dg.lua"

fx_version 'adamant'
games { 'gta5' }

client_scripts {
	'Common.net.dll',
	'Newtonsoft.Json.dll',
	'Common.Client.net.dll',
	'VehicleControl.Client.net.dll',
}

server_scripts {
	'Common.net.dll',
	'Common.Server.net.dll',
	'VehicleControl.Server.net.dll'
}

client_script "@Badger-Anticheat/acloader.lua"