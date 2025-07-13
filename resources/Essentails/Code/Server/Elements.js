global.elements = {};
global.cmds = global.cmds || {};

global._ELEMENT_MARKER = 8194;

elements.MAX_OBJECTS	= 2048;
elements.MAX_VEHICLES	= 512;
elements.MAX_PICKUPS	= 330;
elements.MAX_SPHERES	= 127;
elements.MAX_BLIPS		= 127;
elements.MAX_PEDS		= 512 - server.maxClients;

elements.gameFolderNames =
[
	'unknown',
	'iii',
	'vc',
	'sa',
	'unknown2',
	'iv'
];

elements.paths = {};
elements.paths.objects	= 'Data/' + util.getCurrentShortGameName() + '/Elements/Objects.xml';
elements.paths.vehicles	= 'Data/' + util.getCurrentShortGameName() + '/Elements/Vehicles.xml';
elements.paths.pickups	= 'Data/' + util.getCurrentShortGameName() + '/Elements/Pickups.xml';
elements.paths.spheres	= 'Data/' + util.getCurrentShortGameName() + '/Elements/Spheres.xml';
elements.paths.peds		= 'Data/' + util.getCurrentShortGameName() + '/Elements/Peds.xml';
elements.paths.blips	= 'Data/' + util.getCurrentShortGameName() + '/Elements/Blips.xml';

elements.data = {};
elements.data.objects = [];
elements.data.vehicles = [];
elements.data.pickups = [];
elements.data.spheres = [];
elements.data.peds = [];
elements.data.blips = [];

elements.attr = {};
elements.attr.objects = ['id', 'model', 'position', 'rotation'];
elements.attr.vehicles = ['id', 'model', 'position', 'rotation'];
elements.attr.pickups = ['id', 'model', 'position'];
elements.attr.spheres = ['id', 'position', 'radius'];
elements.attr.peds = ['id', 'model', 'position', 'heading', 'pedType'];
elements.attr.blips = ['id', 'icon', 'position', 'size', 'colour'];

elements.near = {};
elements.near.maxDistanceAway		= 1000000.0;
elements.near.defaultDistanceAway	= 20.0;

// api
elements.gamePath = (path) =>
{
	var folderName = elements.gameFolderNames[server.game];
	if(!folderName)
		folderName = 'UnknownGame';
	return util.format(path, folderName);
};

elements.nearElements = (client, elementName, distanceAway) =>
{
	var near = [];
	var clientPosition = client.player.vehicle ? client.player.vehicle.position : client.player.position;
	for(var i in elements.data[elementName])
	{
		var element = elements.data[elementName][i];
		var distance = clientPosition.distance(element.position);
		if(distance <= distanceAway)
		{
			near.push([element.id, distance]);
		}
	}
	near.sort((a,b) => a[1] > b[1]);
	near = near.map((v) => v[0]);
	return near;
};

elements.getElementData = (elementName, elementId) =>
{
	for(var i in elements.data[elementName])
	{
		if(elements.data[elementName][i].id == elementId)
		{
			return elements.data[elementName][i];
		}
	}
	return null;
};

elements.removeElement = (elementName, elementId) =>
{
	for(var i in elements.data[elementName])
	{
		if(elements.data[elementName][i].id == elementId)
		{
			elements.data[elementName].splice(i, 1);
			return;
		}
	}
};

elements.getElement = (elementId) =>
{
	return getElementFromId(elementId);
};

elements.setPosition = (elementName, elementId, position) =>
{
	var element = getElementFromId(elementId);
	if(element)
	{
		element.position = position;
	}
	var elementData = elements.getElementData(elementName, elementId);
	if(elementData)
		elementData.position = position;
	var elementNames = {
		objects:	'Object',
		vehicles:	'Vehicle',
		pickups:	'Pickup',
		spheres:	'Sphere',
		peds:		'Ped',
		blips:		'Blip'
	};
	xml.attr.set(elements.gamePath(elements.paths[elementName]), elementNames[elementName], {
		id:			elementId
	}, {
		position:	util.posArray(position).join(',')
	});
};

elements.getElementTypeName = (elementId) =>
{
	switch(getElementFromId(elementId).type)
	{
		case ELEMENT_OBJECT:	return 'Object';
		case ELEMENT_VEHICLE:	return 'Vehicle';
		case ELEMENT_PICKUP:	return 'Pickup';
		case _ELEMENT_MARKER:	return 'Sphere';
		case ELEMENT_PED:		return 'Peds';
		case ELEMENT_BLIP:		return 'Blips';
	}
	return 'Unknown';
};

elements.isElementOnScreen = (client, elementId, onScreen) =>
{
	if(!accounts.isClientAuthorized(client))
		return;

	if(!util.isIntValue(elementId))
		return;
	
	if(!util.isBoolValue(onScreen))
		return;
	
	if(!util.isElementId(elementId))
		return;
	
	chat.all(elements.getElementTypeName(elementId) + " ID " + elementId + " is " + (onScreen ? '' : 'not ') + 'on ' + client.name + "'s screen.");
};

// commands
cmds.object = (client, _model, _distanceAway) =>
{
	if(elements.data.objects.length > elements.MAX_OBJECTS)
		return chat.pm(client, 'Max amount of objects already reached! (' + elements.data.objects.length + '/' + elements.MAX_OBJECTS + ')');
	
	var minModel = util.getMinObjectModel();
	var maxModel = util.getMaxObjectModel();
	var maxDistanceAway = 150.0;
	var defaultDistanceAway = 20.0;
	
	[_model, _distanceAway] = util.grabArgs(client,
	[
		(v) => util.isInt(v) && util.between(util.int(v), minModel, maxModel),
		(v) => util.isFloat(v) && util.between(util.float(v), -maxDistanceAway, maxDistanceAway)
	],
	[
		undefined,
		defaultDistanceAway
	], _model, _distanceAway);
	
	if(!client.player)
		return chat.notSpawned(client, client);
	
	if(_model === undefined)
		return chat.pm(client, "You didn't type an object model.");
	
	var model = util.findObjectModel(_model);
	if(model < minModel || model > maxModel)
		return chat.intBetween(client, 'Object Model', minModel, maxModel, _model);
	
	var distanceAway = util.float(_distanceAway);
	if(distanceAway < -maxDistanceAway || distanceAway > maxDistanceAway)
		return chat.intBetween(client, 'Distance Away', -maxDistanceAway, maxDistanceAway, _distanceAway);
	
	if(distanceAway == defaultDistanceAway)
		chat.all(client.name + " added an object with model " + model + ".");
	else
		chat.all(client.name + " added an object " + distanceAway + " units away with model " + model + ".");
	
	var position = client.player.position.addPolar(distanceAway, client.player.heading + (Math.PI / 2.0));
	var rotation = new Vec3(0.0, 0.0, client.player.heading);
	
	elements.addObject(model, position, rotation);
};

cmds.vehicle = (client, _model, _distanceAway) =>
{
	if(elements.data.vehicles.length > elements.MAX_VEHICLES)
		return chat.pm(client, 'Max amount of vehicles already reached! (' + elements.data.vehicles.length + '/' + elements.MAX_VEHICLES + ')');
	
	var minModel = util.getMinVehicleModel();
	var maxModel = util.getMaxVehicleModel();
	var maxDistanceAway = 150.0;
	var defaultDistanceAway = 10.0;
	
	[_model, _distanceAway] = util.grabArgs(client,
	[
		(v) => util.isVehicleModel(v),
		(v) => util.isFloat(v) && util.between(util.float(v), -maxDistanceAway, maxDistanceAway)
	],
	[
		undefined,
		defaultDistanceAway
	], _model, _distanceAway);
	
	if(!client.player)
		return chat.notSpawned(client, client);
	
	if(_model === undefined)
		return chat.pm(client, "You didn't type a vehicle model.");
	
	var model = util.findVehicleModel(_model);
	if(model < minModel || model > maxModel)
		return chat.intBetween(client, 'Vehicle Model', minModel, maxModel, _model);
	
	var distanceAway = util.float(_distanceAway);
	if(distanceAway < -maxDistanceAway || distanceAway > maxDistanceAway)
		return chat.intBetween(client, 'Distance Away', -maxDistanceAway, maxDistanceAway, _distanceAway);
	
	if(distanceAway == defaultDistanceAway)
		chat.all(client.name + " added a vehicle with model " + util.getVehicleModelName(model) + " (" + model + ").");
	else
		chat.all(client.name + " added a vehicle " + distanceAway + " units away with model " + util.getVehicleModelName(model) + " (" + model + ").");
	
	var position = client.player.position.addPolar(distanceAway, client.player.heading + (Math.PI / 2.0));
	var rotation = new Vec3(0.0, 0.0, client.player.heading);
	
	elements.addVehicle(model, position, rotation);
};

cmds.pickup = (client, _model, _distanceAway, _type) =>
{
	if(elements.data.pickups.length > elements.MAX_PICKUPS)
		return chat.pm(client, 'Max amount of pickups already reached! (' + elements.data.pickups.length + '/' + elements.MAX_PICKUPS + ')');
	
	var minModel = util.getMinObjectModel();
	var maxModel = util.getMaxObjectModel();
	var maxDistanceAway = 150.0;
	var defaultDistanceAway = 10.0;
	var minType = 0;
	var maxType = 50;
	var defaultType = 1;
	
	[_model, _distanceAway, _type] = util.grabArgs(client,
	[
		(v) => util.isInt(v) && util.between(util.int(v), minModel, maxModel),
		(v) => util.isFloat(v) && util.between(util.float(v), -maxDistanceAway, maxDistanceAway),
		(v) => util.isInt(v) && util.between(util.int(v), minType, maxType)
	],
	[
		undefined,
		defaultDistanceAway,
		defaultType
	], _model, _distanceAway, _type);
	
	if(!client.player)
		return chat.notSpawned(client, client);
	
	if(_model === undefined)
		return chat.pm(client, "You didn't type a pickup model.");
	
	var model = util.findObjectModel(_model);
	if(model < minModel || model > maxModel)
		return chat.intBetween(client, 'Pickup Model', minModel, maxModel, _model);
	
	var distanceAway = util.float(_distanceAway);
	if(distanceAway < -maxDistanceAway || distanceAway > maxDistanceAway)
		return chat.intBetween(client, 'Distance Away', -maxDistanceAway, maxDistanceAway, _distanceAway);
	
	var type = util.int(_type);
	if(type < minType || type > maxType)
		return chat.intBetween(client, 'Pickup Type', minType, maxType, _type);
	
	if(distanceAway == defaultDistanceAway)
		chat.all(client.name + " added a pickup with model " + model + ".");
	else
		chat.all(client.name + " added a pickup " + distanceAway + " units away with model " + model + ".");
	
	var position = client.player.position.addPolar(distanceAway, client.player.heading + (Math.PI / 2.0));
	
	elements.addPickup(model, position);
};

cmds.sphere = (client, _radius, _distanceAway) =>
{
	if(elements.data.spheres.length > elements.MAX_SPHERES)
		return chat.pm(client, 'Max amount of spheres already reached! (' + elements.data.spheres.length + '/' + elements.MAX_SPHERES + ')');
	
	var minRadius = 0.0000001;
	var maxRadius = 10000.0;
	var maxDistanceAway = 150.0;
	var defaultDistanceAway = 0.0;
	
	[_radius, _distanceAway] = util.grabArgs(client,
	[
		(v) => util.isFloat(v) && util.between(util.float(v), minRadius, maxRadius),
		(v) => util.isFloat(v) && util.between(util.float(v), -maxDistanceAway, maxDistanceAway)
	],
	[
		undefined,
		defaultDistanceAway
	], _radius, _distanceAway);
	
	if(!client.player)
		return chat.notSpawned(client, client);
	
	if(_radius === undefined)
		return chat.pm(client, "You didn't type a radius.");
	
	var radius = util.float(_radius);
	if(radius < minRadius || radius > maxRadius)
		return chat.intBetween(client, 'Sphere Radius', minRadius, maxRadius, _radius);
	
	var distanceAway = util.float(_distanceAway);
	if(distanceAway < -maxDistanceAway || distanceAway > maxDistanceAway)
		return chat.intBetween(client, 'Distance Away', -maxDistanceAway, maxDistanceAway, _distanceAway);
	
	if(distanceAway == defaultDistanceAway)
		chat.all(client.name + " added a sphere with radius " + radius + ".");
	else
		chat.all(client.name + " added a sphere " + distanceAway + " units away with radius " + radius + ".");
	
	var position = client.player.position.addPolar(distanceAway, client.player.heading + (Math.PI / 2.0));
	
	elements.addSphere(position, radius);
};

cmds.ped = (client, _model, _distanceAway, _type) =>
{
	if(elements.data.peds.length > elements.MAX_PEDS)
		return chat.pm(client, 'Max amount of peds already reached! (' + elements.data.peds.length + '/' + elements.MAX_PEDS + ')');
	
	var minModel = util.getMinPedModel();
	var maxModel = util.getMaxPedModel();
	var maxDistanceAway = 150.0;
	var defaultDistanceAway = 1.0;
	var minType = 0;
	var maxType = 50;
	var defaultType = 1;
	
	[_model, _distanceAway, _type] = util.grabArgs(client,
	[
		(v) => util.isInt(v) && util.between(util.int(v), minModel, maxModel),
		(v) => util.isFloat(v) && util.between(util.float(v), -maxDistanceAway, maxDistanceAway),
		(v) => util.isInt(v) && util.between(util.int(v), minType, maxType)
	],
	[
		undefined,
		defaultDistanceAway,
		defaultType
	], _model, _distanceAway, _type);
	
	if(!client.player)
		return chat.notSpawned(client, client);
	
	if(_model === undefined)
		return chat.pm(client, "You didn't type a ped model.");
	
	var model = util.findPedModel(_model);
	if(model < minModel || model > maxModel)
		return chat.intBetween(client, 'Ped Model', minModel, maxModel, _model);
	
	var distanceAway = util.float(_distanceAway);
	if(distanceAway < -maxDistanceAway || distanceAway > maxDistanceAway)
		return chat.intBetween(client, 'Distance Away', -maxDistanceAway, maxDistanceAway, _distanceAway);
	
	var type = util.int(_type);
	if(type < minType || type > maxType)
		return chat.intBetween(client, 'Ped Type', minType, maxType, _type);
	
	if(distanceAway == defaultDistanceAway && type == defaultType)
		chat.all(client.name + " added a ped with model " + model + ".");
	else if(distanceAway != defaultDistanceAway && type != defaultType)
		chat.all(client.name + " added a ped " + distanceAway + " units away with model " + model + " and ped type " + type + ".");
	else if(distanceAway != defaultDistanceAway)
		chat.all(client.name + " added a ped " + distanceAway + " units away with model " + model + ".");
	else if(type != defaultType)
		chat.all(client.name + " added a ped with model " + model + " and ped type " + type + ".");
	else
		chat.all(client.name + " added a ped with model " + model + ".");
	
	var position = client.player.position.addPolar(distanceAway, client.player.heading + (Math.PI / 2.0));
	var heading = client.player.heading;
	
	elements.addPed(model, position, heading, type);
};

cmds.blip = (client, _icon, _distanceAway, _size) =>
{
	if(elements.data.blips.length > elements.MAX_BLIPS)
		return chat.pm(client, 'Max amount of blips already reached! (' + elements.data.blips.length + '/' + elements.MAX_BLIPS + ')');
	
	var minIcon = util.getMinBlipModel();
	var maxIcon = util.getMaxBlipModel();
	var maxDistanceAway = 150.0;
	var defaultDistanceAway = 0.0;
	var minSize = 0;
	var maxSize = 50;
	var defaultSize = 2;
	
	[_icon, _distanceAway, _size] = util.grabArgs(client,
	[
		(v) => util.isInt(v) && util.between(util.int(v), minIcon, maxIcon),
		(v) => util.isFloat(v) && util.between(util.float(v), -maxDistanceAway, maxDistanceAway),
		(v) => util.isInt(v) && util.between(util.int(v), minSize, maxSize)
	],
	[
		undefined,
		defaultDistanceAway,
		defaultSize
	], _icon, _distanceAway, _size);
	
	if(!client.player)
		return chat.notSpawned(client, client);
	
	if(_icon === undefined)
		return chat.pm(client, "You didn't type a blip icon.");
	
	var icon = util.findBlipIcon(_icon);
	if(icon < minIcon || icon > maxIcon)
		return chat.intBetween(client, 'Blip Icon', minIcon, maxIcon, _icon);
	
	var distanceAway = util.float(_distanceAway);
	if(distanceAway < -maxDistanceAway || distanceAway > maxDistanceAway)
		return chat.intBetween(client, 'Distance Away', -maxDistanceAway, maxDistanceAway, _distanceAway);
	
	var size = util.int(_size);
	if(size < minSize || size > maxSize)
		return chat.intBetween(client, 'Blip Size', minSize, maxSize, _size);
	
	if(distanceAway == defaultDistanceAway)
		chat.all(client.name + " added a blip with icon " + icon + ".");
	else
		chat.all(client.name + " added a blip " + distanceAway + " units away with icon " + icon + ".");
	
	var position = client.player.position.addPolar(distanceAway, client.player.heading + (Math.PI / 2.0));
	var colour = util.getRandomRGB();
	
	elements.addBlip(icon, position, size, colour);
};

cmds.maxplayers = (client) => chat.all('Max players: ' + server.maxClients);
cmds.maxobjects = (client) => chat.all('Max objects: ' + elements.MAX_OBJECTS);
cmds.maxvehicles = (client) => chat.all('Max vehicles: ' + elements.MAX_VEHICLES);
cmds.maxpickups = (client) => chat.all('Max pickups: ' + elements.MAX_PICKUPS);
cmds.maxspheres = (client) => chat.all('Max spheres: ' + elements.MAX_SPHERES);
cmds.maxpeds = (client) => chat.all('Max peds: ' + elements.MAX_PEDS + ' (excluding ' + server.maxClients + ' player peds)');
cmds.maxblips = (client) => chat.all('Max blips: ' + elements.MAX_BLIPS);

cmds.players = (client) => chat.all('Players: ' + getClients().length + '/' + server.maxClients);
cmds.objects = (client) => chat.all('Objects: ' + elements.data.objects.length + '/' + elements.MAX_OBJECTS);
cmds.vehicles = (client) => chat.all('Vehicles: ' + elements.data.vehicles.length + '/' + elements.MAX_VEHICLES);
cmds.pickups = (client) => chat.all('Pickups: ' + elements.data.pickups.length + '/' + elements.MAX_PICKUPS);
cmds.spheres = (client) => chat.all('Spheres: ' + elements.data.spheres.length + '/' + elements.MAX_SPHERES);
cmds.peds = (client) => chat.all('Peds: ' + elements.data.peds.length + '/' + elements.MAX_PEDS + ' (excluding ' + getClients().length + '/' + server.maxClients + ' player peds)');
cmds.blips = (client) => chat.all('Blips: ' + elements.data.blips.length + '/' + elements.MAX_BLIPS);

cmds.elements = (client) => chat.all([
	'Players: ' + getClients().length + '/' + server.maxClients,
	'Objects: ' + elements.data.objects.length + '/' + elements.MAX_OBJECTS,
	'Vehicles: ' + elements.data.vehicles.length + '/' + elements.MAX_VEHICLES,
	'Pickups: ' + elements.data.pickups.length + '/' + elements.MAX_PICKUPS,
	'Spheres: ' + elements.data.spheres.length + '/' + elements.MAX_SPHERES,
	'Peds: ' + elements.data.peds.length + '/' + elements.MAX_PEDS,
	'Blips: ' + elements.data.blips.length + '/' + elements.MAX_BLIPS
].join(', '));

cmds.objectids = (client) => elements.data.objects.length == 0 ? chat.all('There are no objects.') : chat.all('Object IDs: ' + elements.data.objects.map(data => data.id).join(' '));
cmds.vehicleids = (client) => elements.data.vehicles.length == 0 ? chat.all('There are no vehicles.') : chat.all('Vehicle IDs: ' + elements.data.vehicles.map(data => data.id).join(' '));
cmds.pickupids = (client) => elements.data.pickups.length == 0 ? chat.all('There are no pickups.') : chat.all('Pickup IDs: ' + elements.data.pickups.map(data => data.id).join(' '));
cmds.sphereids = (client) => elements.data.spheres.length == 0 ? chat.all('There are no spheres.') : chat.all('Sphere IDs: ' + elements.data.spheres.map(data => data.id).join(' '));
cmds.pedids = (client) => elements.data.peds.length == 0 ? chat.all('There are no peds.') : chat.all('Ped IDs: ' + elements.data.peds.map(data => data.id).join(' '));
cmds.blipids = (client) => elements.data.blips.length == 0 ? chat.all('There are no blips.') : chat.all('Blip IDs: ' + elements.data.blips.map(data => data.id).join(' '));

cmds.clientids = (client) => chat.all('Client IDs: ' + getClients().map(client => client.index).join(' '));

cmds.playerids = (client) =>
{
	var ids = [];
	getClients().map(client =>
	{
		if(client.player)
		{
			ids.push(client.player.id);
		}
	});
	if(ids.length == 0)
		chat.all('There are no spawned players.');
	else
		chat.all('Player IDs: ' + ids.join(' '));
};

cmds.playervehicleids = (client) =>
{
	var ids = [];
	getClients().map(client =>
	{
		if(client.player && client.player.vehicle)
		{
			ids.push(client.player.vehicle.id);
		}
	});
	if(ids.length == 0)
		chat.all('There are no players in a vehicle.');
	else
		chat.all('Player Vehicle IDs: ' + ids.join(' '));
};

cmds.objectsyncers = (client) => elements.data.objects.length == 0 ? chat.all('There are no objects.') : chat.all('Object syncers: ' + elements.data.objects.map(data => getElementFromId(data.id).syncer == -1 ? 'No syncer (ID ' + data.id + ')' : getClients()[getElementFromId(data.id).syncer].name + ' (ID ' + data.id + ')').join(', '));
cmds.vehiclesyncers = (client) => elements.data.vehicles.length == 0 ? chat.all('There are no vehicles.') : chat.all('Vehicle syncers: ' + elements.data.vehicles.map(data => getElementFromId(data.id).syncer == -1 ? 'No syncer (ID ' + data.id + ')' : getClients()[getElementFromId(data.id).syncer].name + ' (ID ' + data.id + ')').join(', '));
cmds.pickupsyncers = (client) => elements.data.pickups.length == 0 ? chat.all('There are no pickups.') : chat.all('Pickup syncers: ' + elements.data.pickups.map(data => getElementFromId(data.id).syncer == -1 ? 'No syncer (ID ' + data.id + ')' : getClients()[getElementFromId(data.id).syncer].name + ' (ID ' + data.id + ')').join(', '));
cmds.spheresyncers = (client) => elements.data.spheres.length == 0 ? chat.all('There are no spheres.') : chat.all('Sphere syncers: ' + elements.data.spheres.map(data => getElementFromId(data.id).syncer == -1 ? 'No syncer (ID ' + data.id + ')' : etClients()[getElementFromId(data.id).syncer].name + ' (ID ' + data.id + ')').join(', '));
cmds.pedsyncers = (client) => elements.data.peds.length == 0 ? chat.all('There are no peds.') : chat.all('Ped syncers: ' + elements.data.peds.map(data => getElementFromId(data.id).syncer == -1 ? 'No syncer (ID ' + data.id + ')' : getClients()[getElementFromId(data.id).syncer].name + ' (ID ' + data.id + ')').join(', '));
cmds.blipsyncers = (client) => elements.data.blips.length == 0 ? chat.all('There are no blips.') : chat.all('Blip syncers: ' + elements.data.blips.map(data => getElementFromId(data.id).syncer == -1 ? 'No syncer (ID ' + data.id + ')' : getClients()[getElementFromId(data.id).syncer].name + ' (ID ' + data.id + ')').join(', '));

cmds.objectdimensions = (client) =>
{
	var data2 = [];
	if(elements.data.objects.length == 0)
		chat.all('There are no objects.');
	else
	{
		elements.data.objects.forEach(data =>
		{
			if(data2[getElementFromId(data.id).dimension])
				data2[getElementFromId(data.id).dimension].push(data.id);
			else
				data2[getElementFromId(data.id).dimension] = [data.id];
		});
		
		chat.all('Object dimensions: ' + data2.map((ids,dimension) => 'Dimension ' + dimension + ' IDs (' + ids.join(' ') + ')').join(', '));
	}
};

cmds.vehicledimensions = (client) =>
{
	var data2 = [];
	if(elements.data.vehicles.length == 0)
		chat.all('There are no vehicles.');
	else
	{
		elements.data.vehicles.forEach(data =>
		{
			if(data2[getElementFromId(data.id).dimension])
				data2[getElementFromId(data.id).dimension].push(data.id);
			else
				data2[getElementFromId(data.id).dimension] = [data.id];
		});
		
		chat.all('Vehicle dimensions: ' + data2.map((ids,dimension) => 'Dimension ' + dimension + ' IDs (' + ids.join(' ') + ')').join(', '));
	}
};

cmds.pickupdimensions = (client) =>
{
	var data2 = [];
	if(elements.data.pickups.length == 0)
		chat.all('There are no pickups.');
	else
	{
		elements.data.pickups.forEach(data =>
		{
			if(data2[getElementFromId(data.id).dimension])
				data2[getElementFromId(data.id).dimension].push(data.id);
			else
				data2[getElementFromId(data.id).dimension] = [data.id];
		});
		
		chat.all('Pickup dimensions: ' + data2.map((ids,dimension) => 'Dimension ' + dimension + ' IDs (' + ids.join(' ') + ')').join(', '));
	}
};

cmds.spheredimensions = (client) =>
{
	var data2 = [];
	if(elements.data.spheres.length == 0)
		chat.all('There are no spheres.');
	else
	{
		elements.data.spheres.forEach(data =>
		{
			if(data2[getElementFromId(data.id).dimension])
				data2[getElementFromId(data.id).dimension].push(data.id);
			else
				data2[getElementFromId(data.id).dimension] = [data.id];
		});
		
		chat.all('Sphere dimensions: ' + data2.map((ids,dimension) => 'Dimension ' + dimension + ' IDs (' + ids.join(' ') + ')').join(', '));
	}
};

cmds.peddimensions = (client) =>
{
	var data2 = [];
	if(elements.data.peds.length == 0)
		chat.all('There are no peds.');
	else
	{
		elements.data.peds.forEach(data =>
		{
			if(data2[getElementFromId(data.id).dimension])
				data2[getElementFromId(data.id).dimension].push(data.id);
			else
				data2[getElementFromId(data.id).dimension] = [data.id];
		});
		
		chat.all('Ped dimensions: ' + data2.map((ids,dimension) => 'Dimension ' + dimension + ' IDs (' + ids.join(' ') + ')').join(', '));
	}
};

cmds.blipdimensions = (client) =>
{
	var data2 = [];
	if(elements.data.blips.length == 0)
		chat.all('There are no blips.');
	else
	{
		elements.data.blips.forEach(data =>
		{
			if(blips[getElementFromId(data.id).dimension])
				data2[getElementFromId(data.id).dimension].push(data.id);
			else
				data2[getElementFromId(data.id).dimension] = [data.id];
		});
		
		chat.all('Blip dimensions: ' + data2.map((ids,dimension) => 'Dimension ' + dimension + ' IDs (' + ids.join(' ') + ')').join(', '));
	}
};

cmds.playerdimensions = (client) =>
{
	var data1 = [];
	var data2 = [];
	getClients().forEach(client2 =>
	{
		if(client2.player)
		{
			data1.push(client2);
		}
	});
	
	if(data1.length == 0)
		chat.all('There are no spawned players.');
	else
	{
		data1.forEach(client2 =>
		{
			if(data2[client2.player.dimension])
				data2[client2.player.dimension].push(client2.name);
			else
				data2[client2.player.dimension] = [client2.name];
		});
		
		chat.all('Player dimensions: ' + data2.map((ids,dimension) => 'Dimension ' + dimension + ' (' + ids.join(' ') + ')').join(', '));
	}
};







cmds.objectdistance = (client, _elementId) =>
{
	[_elementId] = util.grabArgs(client,
	[
		(v) => util.isInt(v)
	],
	[
	], _elementId);
	
	if(!client.player)
		return chat.notSpawned(client, client);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type an object ID.");
	
	var elementId = util.int(_elementId, -1);
	if(elementId < 0 || !elements.isObject(elementId))
		return chat.pm(client, 'Invalid object ID.');
	
	var distance = elements.getElementData('objects', elementId).position.distance(client.player.position);
	chat.all(client.name + " is " + util.round(distance, 3) + " game units away from object ID " + elementId + ".");
};

cmds.vehicledistance = (client, _elementId) =>
{
	[_elementId] = util.grabArgs(client,
	[
		(v) => util.isInt(v)
	],
	[
	], _elementId);
	
	if(!client.player)
		return chat.notSpawned(client, client);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type a vehicle ID.");
	
	var elementId = util.int(_elementId, -1);
	if(elementId < 0 || !elements.isVehicle(elementId))
		return chat.pm(client, 'Invalid vehicle ID.');
	
	var distance = elements.getElementData('vehicles', elementId).position.distance(client.player.position);
	chat.all(client.name + " is " + util.round(distance, 3) + " game units away from vehicle ID " + elementId + ".");
};

cmds.pickupdistance = (client, _elementId) =>
{
	[_elementId] = util.grabArgs(client,
	[
		(v) => util.isInt(v)
	],
	[
	], _elementId);
	
	if(!client.player)
		return chat.notSpawned(client, client);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type a pickup ID.");
	
	var elementId = util.int(_elementId, -1);
	if(elementId < 0 || !elements.isPickup(elementId))
		return chat.pm(client, 'Invalid pickup ID.');
	
	var distance = elements.getElementData('pickups', elementId).position.distance(client.player.position);
	chat.all(client.name + " is " + util.round(distance, 3) + " game units away from pickup ID " + elementId + ".");
};

cmds.spheredistance = (client, _elementId) =>
{
	[_elementId] = util.grabArgs(client,
	[
		(v) => util.isInt(v)
	],
	[
	], _elementId);
	
	if(!client.player)
		return chat.notSpawned(client, client);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type a sphere ID.");
	
	var elementId = util.int(_elementId, -1);
	if(elementId < 0 || !elements.isSphere(elementId))
		return chat.pm(client, 'Invalid sphere ID.');
	
	var distance = elements.getElementData('spheres', elementId).position.distance(client.player.position);
	chat.all(client.name + " is " + util.round(distance, 3) + " game units away from sphere ID " + elementId + ".");
};

cmds.peddistance = (client, _elementId) =>
{
	[_elementId] = util.grabArgs(client,
	[
		(v) => util.isInt(v)
	],
	[
	], _elementId);
	
	if(!client.player)
		return chat.notSpawned(client, client);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type a ped ID.");
	
	var elementId = util.int(_elementId, -1);
	if(elementId < 0 || !elements.isPed(elementId))
		return chat.pm(client, 'Invalid ped ID.');
	
	var distance = elements.getElementData('peds', elementId).position.distance(client.player.position);
	chat.all(client.name + " is " + util.round(distance, 3) + " game units away from ped ID " + elementId + ".");
};

cmds.blipdistance = (client, _elementId) =>
{
	[_elementId] = util.grabArgs(client,
	[
		(v) => util.isInt(v)
	],
	[
	], _elementId);
	
	if(!client.player)
		return chat.notSpawned(client, client);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type a blip ID.");
	
	var elementId = util.int(_elementId, -1);
	if(elementId < 0 || !elements.isBlip(elementId))
		return chat.pm(client, 'Invalid blip ID.');
	
	var distance = elements.getElementData('blips', elementId).position.distance(client.player.position);
	chat.all(client.name + " is " + util.round(distance, 3) + " game units away from blip ID " + elementId + ".");
};

cmds.playerdistance = (client, _target) =>
{
	[_target] = util.grabArgs(client,
	[
		(v) => util.isClient(v)
	],
	[
		client.name
	], _target);
	
	var target = util.findClient(_target, client);
	if(!target)
		return chat.invalidClient(client, _target);
	
	if(client == target)
		return chat.pm(client, "You can't check the distance to yourself.");
	
	if(!target.player)
		return chat.notSpawned(client, target);
	
	var distance = target.player.position.distance(client.player.position);
	chat.all(client.name + " is " + util.round(distance, 3) + " game units away from player " + target.name + ".");
};









cmds.nearplayers = (client, _distanceAway) =>
{
	[_distanceAway] = util.grabArgs(client,
	[
		(v) => util.isFloat(v) && util.between(util.float(v), -elements.near.maxDistanceAway, elements.near.maxDistanceAway),
	],
	[
		elements.near.defaultDistanceAway
	], _distanceAway);
	
	if(!client.player)
		return chat.notSpawned(client, client);
	
	var distanceAway = util.float(_distanceAway);
	if(distanceAway < -elements.near.maxDistanceAway || distanceAway > elements.near.maxDistanceAway)
		return chat.intBetween(client, 'Distance Away', -elements.near.maxDistanceAway, elements.near.maxDistanceAway, _distanceAway);
	
	var near = [];
	var clientPosition = client.player.position;
	getClients().map(v =>
	{
		if(v != client && v.player && v.player.position.distance(clientPosition) <= distanceAway)
		{
			near.push(client);
		}
	});
	near = near.map(v => v.name);
	
	if(near.length == 0)
		chat.all(client.name + " is not near any players. (" + distanceAway + " units)");
	else
		chat.all(client.name + " is near " + util.pluralWithCount('player', near.length) + " (" + distanceAway + " units): " + near.join(' '));
};

cmds.nearobjects = (client, _distanceAway) =>
{
	[_distanceAway] = util.grabArgs(client,
	[
		(v) => util.isFloat(v) && util.between(util.float(v), -elements.near.maxDistanceAway, elements.near.maxDistanceAway),
	],
	[
		elements.near.defaultDistanceAway
	], _distanceAway);
	
	if(!client.player)
		return chat.notSpawned(client, client);
	
	var distanceAway = util.float(_distanceAway);
	if(distanceAway < -elements.near.maxDistanceAway || distanceAway > elements.near.maxDistanceAway)
		return chat.intBetween(client, 'Distance Away', -elements.near.maxDistanceAway, elements.near.maxDistanceAway, _distanceAway);
	
	var near = elements.nearElements(client, 'objects', distanceAway);
	if(near.length == 0)
		chat.all(client.name + " is not near any objects. (" + distanceAway + " units)");
	else
		chat.all(client.name + " is near " + util.pluralWithCount('object', near.length) + " (" + distanceAway + " units): " + near.join(' '));
};

cmds.nearvehicles = (client, _distanceAway) =>
{
	[_distanceAway] = util.grabArgs(client,
	[
		(v) => util.isFloat(v) && util.between(util.float(v), -elements.near.maxDistanceAway, elements.near.maxDistanceAway),
	],
	[
		elements.near.defaultDistanceAway
	], _distanceAway);
	
	if(!client.player)
		return chat.notSpawned(client, client);
	
	var distanceAway = util.float(_distanceAway);
	if(distanceAway < -elements.near.maxDistanceAway || distanceAway > elements.near.maxDistanceAway)
		return chat.intBetween(client, 'Distance Away', -elements.near.maxDistanceAway, elements.near.maxDistanceAway, _distanceAway);
	
	var near = elements.nearElements(client, 'vehicles', distanceAway);
	if(near.length == 0)
		chat.all(client.name + " is not near any vehicles. (" + distanceAway + " units)");
	else
		chat.all(client.name + " is near " + util.pluralWithCount('vehicle', near.length) + " (" + distanceAway + " units): " + near.join(' '));
};

cmds.nearpickups = (client, _distanceAway) =>
{
	[_distanceAway] = util.grabArgs(client,
	[
		(v) => util.isFloat(v) && util.between(util.float(v), -elements.near.maxDistanceAway, elements.near.maxDistanceAway),
	],
	[
		elements.near.defaultDistanceAway
	], _distanceAway);
	
	if(!client.player)
		return chat.notSpawned(client, client);
	
	var distanceAway = util.float(_distanceAway);
	if(distanceAway < -elements.near.maxDistanceAway || distanceAway > elements.near.maxDistanceAway)
		return chat.intBetween(client, 'Distance Away', -elements.near.maxDistanceAway, elements.near.maxDistanceAway, _distanceAway);
	
	var near = elements.nearElements(client, 'pickups', distanceAway);
	if(near.length == 0)
		chat.all(client.name + " is not near any pickups. (" + distanceAway + " units)");
	else
		chat.all(client.name + " is near " + util.pluralWithCount('pickup', near.length) + " (" + distanceAway + " units): " + near.join(' '));
};

cmds.nearspheres = (client, _distanceAway) =>
{
	[_distanceAway] = util.grabArgs(client,
	[
		(v) => util.isFloat(v) && util.between(util.float(v), -elements.near.maxDistanceAway, elements.near.maxDistanceAway),
	],
	[
		elements.near.defaultDistanceAway
	], _distanceAway);
	
	if(!client.player)
		return chat.notSpawned(client, client);
	
	var distanceAway = util.float(_distanceAway);
	if(distanceAway < -elements.near.maxDistanceAway || distanceAway > elements.near.maxDistanceAway)
		return chat.intBetween(client, 'Distance Away', -elements.near.maxDistanceAway, elements.near.maxDistanceAway, _distanceAway);
	
	var near = elements.nearElements(client, 'spheres', distanceAway);
	if(near.length == 0)
		chat.all(client.name + " is not near any spheres. (" + distanceAway + " units)");
	else
		chat.all(client.name + " is near " + util.pluralWithCount('sphere', near.length) + " (" + distanceAway + " units): " + near.join(' '));
};

cmds.nearpeds = (client, _distanceAway) =>
{
	[_distanceAway] = util.grabArgs(client,
	[
		(v) => util.isFloat(v) && util.between(util.float(v), -elements.near.maxDistanceAway, elements.near.maxDistanceAway),
	],
	[
		elements.near.defaultDistanceAway
	], _distanceAway);
	
	if(!client.player)
		return chat.notSpawned(client, client);
	
	var distanceAway = util.float(_distanceAway);
	if(distanceAway < -elements.near.maxDistanceAway || distanceAway > elements.near.maxDistanceAway)
		return chat.intBetween(client, 'Distance Away', -elements.near.maxDistanceAway, elements.near.maxDistanceAway, _distanceAway);
	
	var near = elements.nearElements(client, 'peds', distanceAway);
	if(near.length == 0)
		chat.all(client.name + " is not near any peds. (" + distanceAway + " units)");
	else
		chat.all(client.name + " is near " + util.pluralWithCount('ped', near.length) + " (" + distanceAway + " units): " + near.join(' '));
};

cmds.nearblips = (client, _distanceAway) =>
{
	[_distanceAway] = util.grabArgs(client,
	[
		(v) => util.isFloat(v) && util.between(util.float(v), -elements.near.maxDistanceAway, elements.near.maxDistanceAway),
	],
	[
		elements.near.defaultDistanceAway
	], _distanceAway);
	
	if(!client.player)
		return chat.notSpawned(client, client);
	
	var distanceAway = util.float(_distanceAway);
	if(distanceAway < -elements.near.maxDistanceAway || distanceAway > elements.near.maxDistanceAway)
		return chat.intBetween(client, 'Distance Away', -elements.near.maxDistanceAway, elements.near.maxDistanceAway, _distanceAway);
	
	var near = elements.nearElements(client, 'blips', distanceAway);
	if(near.length == 0)
		chat.all(client.name + " is not near any blips. (" + distanceAway + " units)");
	else
		chat.all(client.name + " is near " + util.pluralWithCount('blip', near.length) + " (" + distanceAway + " units): " + near.join(' '));
};



cmds.removeobject = (client, _elementId) =>
{
	[_elementId] = util.grabArgs(client,
	[
		(v) => util.isInt(v),
	],
	[
	], _elementId);
	
	if(_elementId === undefined)
	{
		var newEnabledState = !removeMode.isRemoveModeEnabled(client, ELEMENT_OBJECT);
		chat.all(client.name + " " + (newEnabledState ? "enabled" : "disabled") + " remove object mode.");
		if(newEnabledState)
			removeMode.enableRemoveMode(client, ELEMENT_OBJECT);
		else
			removeMode.disableRemoveMode(client);
		return;
	}
	
	var elementId = util.int(_elementId);
	if(elementId < 0 || elementId > elements.MAX_OBJECTS)
		return chat.intBetween(client, 'Object ID', 0, elements.MAX_OBJECTS, _elementId);
	
	if(!elements.isObject(elementId))
		return chat.pm(client, 'Object ID ' + elementId + ' does not exist.');
	
	chat.all(client.name + " removed object ID " + elementId + ". (Model " + getElementFromId(elementId).modelIndex + ")");
	elements.removeObject(elementId);
};

cmds.removevehicle = (client, _elementId) =>
{
	[_elementId] = util.grabArgs(client,
	[
		(v) => util.isInt(v),
	],
	[
	], _elementId);
	
	if(_elementId === undefined)
	{
		var newEnabledState = !removeMode.isRemoveModeEnabled(client, ELEMENT_VEHICLE);
		chat.all(client.name + " " + (newEnabledState ? "enabled" : "disabled") + " remove vehicle mode.");
		if(newEnabledState)
			removeMode.enableRemoveMode(client, ELEMENT_VEHICLE);
		else
			removeMode.disableRemoveMode(client);
		return;
	}
	
	var elementId = util.int(_elementId);
	if(elementId < 0 || elementId > elements.MAX_VEHICLES)
		return chat.intBetween(client, 'Vehicle ID', 0, elements.MAX_VEHICLES, _elementId);
	
	if(!elements.isVehicle(elementId))
		return chat.pm(client, 'Vehicle ID ' + elementId + ' does not exist.');
	
	chat.all(client.name + " removed vehicle ID " + elementId + ". (Model " + util.getVehicleModelName(getElementFromId(elementId).modelIndex) + " ID " + getElementFromId(elementId).modelIndex + ")");
	elements.removeVehicle(elementId);
};

cmds.removepickup = (client, _elementId) =>
{
	[_elementId] = util.grabArgs(client,
	[
		(v) => util.isInt(v),
	],
	[
	], _elementId);
	
	if(_elementId === undefined)
	{
		var newEnabledState = !removeMode.isRemoveModeEnabled(client, ELEMENT_PICKUP);
		chat.all(client.name + " " + (newEnabledState ? "enabled" : "disabled") + " remove pickup mode.");
		if(newEnabledState)
			removeMode.enableRemoveMode(client, ELEMENT_PICKUP);
		else
			removeMode.disableRemoveMode(client);
		return;
	}
	
	var elementId = util.int(_elementId);
	if(elementId < 0 || elementId > elements.MAX_PICKUPS)
		return chat.intBetween(client, 'Pickup ID', 0, elements.MAX_PICKUPS, _elementId);
	
	if(!elements.isPickup(elementId))
		return chat.pm(client, 'Pickup ID ' + elementId + ' does not exist.');
	
	chat.all(client.name + " removed pickup ID " + elementId + ". (Model " + elements.getElementData('pickups', elementId).model + ")");
	elements.removePickup(elementId);
};

cmds.removesphere = (client, _elementId) =>
{
	[_elementId] = util.grabArgs(client,
	[
		(v) => util.isInt(v),
	],
	[
	], _elementId);
	
	if(_elementId === undefined)
	{
		var newEnabledState = !removeMode.isRemoveModeEnabled(client, _ELEMENT_MARKER);
		chat.all(client.name + " " + (newEnabledState ? "enabled" : "disabled") + " remove sphere mode.");
		if(newEnabledState)
			removeMode.enableRemoveMode(client, _ELEMENT_MARKER);
		else
			removeMode.disableRemoveMode(client);
		return;
	}
	
	var elementId = util.int(_elementId);
	if(elementId < 0 || elementId > elements.MAX_SPHERES)
		return chat.intBetween(client, 'Sphere ID', 0, elements.MAX_SPHERES, _elementId);
	
	if(!elements.isSphere(elementId))
		return chat.pm(client, 'Sphere ID ' + elementId + ' does not exist.');
	
	chat.all(client.name + " removed sphere ID " + elementId + ". (Radius " + elements.getElementData('spheres', elementId).radius + ")");
	elements.removeSphere(elementId);
};

cmds.removeblip = (client, _elementId) =>
{
	[_elementId] = util.grabArgs(client,
	[
		(v) => util.isInt(v),
	],
	[
	], _elementId);
	
	if(_elementId === undefined)
	{
		var newEnabledState = !removeMode.isRemoveModeEnabled(client, ELEMENT_BLIP);
		chat.all(client.name + " " + (newEnabledState ? "enabled" : "disabled") + " remove blip mode.");
		if(newEnabledState)
			removeMode.enableRemoveMode(client, ELEMENT_BLIP);
		else
			removeMode.disableRemoveMode(client);
		return;
	}
	
	var elementId = util.int(_elementId);
	if(elementId < 0 || elementId > elements.MAX_BLIPS)
		return chat.intBetween(client, 'Blip ID', 0, elements.MAX_BLIPS, _elementId);
	
	if(!elements.isBlip(elementId))
		return chat.pm(client, 'Blip ID ' + elementId + ' does not exist.');
	
	chat.all(client.name + " removed blip ID " + elementId + ". (Icon " + elements.getElementData('blips', elementId).icon + ")");
	elements.removeBlip(elementId);
};

cmds.removeped = (client, _elementId) =>
{
	[_elementId] = util.grabArgs(client,
	[
		(v) => util.isInt(v),
	],
	[
	], _elementId);
	
	if(_elementId === undefined)
	{
		var newEnabledState = !removeMode.isRemoveModeEnabled(client, ELEMENT_PED);
		chat.all(client.name + " " + (newEnabledState ? "enabled" : "disabled") + " remove ped mode.");
		if(newEnabledState)
			removeMode.enableRemoveMode(client, ELEMENT_PED);
		else
			removeMode.disableRemoveMode(client);
		return;
	}
	
	var elementId = util.int(_elementId);
	if(elementId < 0 || elementId > elements.MAX_PEDS)
		return chat.intBetween(client, 'Ped ID', 0, elements.MAX_PEDS, _elementId);
	
	if(!elements.isPed(elementId))
		return chat.pm(client, 'Ped ID ' + elementId + ' does not exist.');
	
	chat.all(client.name + " removed ped ID " + elementId + ". (Model " + getElementFromId(elementId).modelIndex + ")");
	elements.removePed(elementId);
};









cmds.isobjectonscreen = (client, _elementId) =>
{
	[_elementId] = util.grabArgs(client,
	[
		(v) => util.isInt(v),
	],
	[
	], _elementId);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type an object ID.");
	
	var elementId = util.int(_elementId);
	if(elementId < 0 || elementId > elements.MAX_OBJECTS)
		return chat.intBetween(client, 'Object ID', 0, elements.MAX_OBJECTS, _elementId);
	
	if(!elements.isObject(elementId))
		return chat.pm(client, 'Object ID ' + elementId + ' does not exist.');
	
	util.callClientMethod(client, 'elements.isElementOnScreen', elementId);
};

cmds.isvehicleonscreen = (client, _elementId) =>
{
	[_elementId] = util.grabArgs(client,
	[
		(v) => util.isInt(v),
	],
	[
	], _elementId);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type a vehicle ID.");
	
	var elementId = util.int(_elementId);
	if(elementId < 0 || elementId > elements.MAX_VEHICLES)
		return chat.intBetween(client, 'Vehicle ID', 0, elements.MAX_VEHICLES, _elementId);
	
	if(!elements.isVehicle(elementId))
		return chat.pm(client, 'Vehicle ID ' + elementId + ' does not exist.');
	
	util.callClientMethod(client, 'elements.isElementOnScreen', elementId);
};

cmds.ispickuponscreen = (client, _elementId) =>
{
	[_elementId] = util.grabArgs(client,
	[
		(v) => util.isInt(v),
	],
	[
	], _elementId);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type an pickup ID.");
	
	var elementId = util.int(_elementId);
	if(elementId < 0 || elementId > elements.MAX_PICKUPS)
		return chat.intBetween(client, 'Pickup ID', 0, elements.MAX_PICKUPS, _elementId);
	
	if(!elements.isPickup(elementId))
		return chat.pm(client, 'Pickup ID ' + elementId + ' does not exist.');
	
	util.callClientMethod(client, 'elements.isElementOnScreen', elementId);
};

cmds.issphereonscreen = (client, _elementId) =>
{
	[_elementId] = util.grabArgs(client,
	[
		(v) => util.isInt(v),
	],
	[
	], _elementId);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type an sphere ID.");
	
	var elementId = util.int(_elementId);
	if(elementId < 0 || elementId > elements.MAX_SPHERES)
		return chat.intBetween(client, 'Sphere ID', 0, elements.MAX_SPHERES, _elementId);
	
	if(!elements.isSphere(elementId))
		return chat.pm(client, 'Sphere ID ' + elementId + ' does not exist.');
	
	util.callClientMethod(client, 'elements.isElementOnScreen', elementId);
};

cmds.ispedonscreen = (client, _elementId) =>
{
	[_elementId] = util.grabArgs(client,
	[
		(v) => util.isInt(v),
	],
	[
	], _elementId);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type an ped ID.");
	
	var elementId = util.int(_elementId);
	if(elementId < 0 || elementId > elements.MAX_PEDS)
		return chat.intBetween(client, 'Ped ID', 0, elements.MAX_PEDS, _elementId);
	
	if(!elements.isPed(elementId))
		return chat.pm(client, 'Ped ID ' + elementId + ' does not exist.');
	
	util.callClientMethod(client, 'elements.isElementOnScreen', elementId);
};

cmds.isbliponscreen = (client, _elementId) =>
{
	[_elementId] = util.grabArgs(client,
	[
		(v) => util.isInt(v),
	],
	[
	], _elementId);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type an blip ID.");
	
	var elementId = util.int(_elementId);
	if(elementId < 0 || elementId > elements.MAX_BLIPS)
		return chat.intBetween(client, 'Blip ID', 0, elements.MAX_BLIPS, _elementId);
	
	if(!elements.isBlip(elementId))
		return chat.pm(client, 'Blip ID ' + elementId + ' does not exist.');
	
	util.callClientMethod(client, 'elements.isElementOnScreen', elementId);
};






cmds.saveobject = (client, _elementId) =>
{
	if(!client.player)
		return chat.notSpawned(client, client);
	
	var elementId = util.int(_elementId);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type an object ID.");
	
	if(!elements.isObject(elementId))
		return chat.pm(client, 'Invalid object ID.');
	
	chat.all(client.name + ' updated the position for object ID ' + elementId + '.');
	
	var position = client.player.vehicle ? client.player.vehicle.position : client.player.position;
	elements.setPosition('objects', elementId, position);
};

cmds.savevehicle = (client, _elementId) =>
{
	if(!client.player)
		return chat.notSpawned(client, client);
	
	var elementId = util.int(_elementId);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type a vehicle ID.");
	
	if(!elements.isVehicle(elementId))
		return chat.pm(client, 'Invalid vehicle ID.');
	
	chat.all(client.name + ' updated the position for vehicle ID ' + elementId + '.');
	
	var position = client.player.vehicle ? client.player.vehicle.position : client.player.position;
	elements.setPosition('vehicles', elementId, position);
};

cmds.savepickup = (client, _elementId) =>
{
	if(!client.player)
		return chat.notSpawned(client, client);
	
	var elementId = util.int(_elementId);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type a pickup ID.");
	
	if(!elements.isPickup(elementId))
		return chat.pm(client, 'Invalid pickup ID.');
	
	chat.all(client.name + ' updated the position for pickup ID ' + elementId + '.');
	
	var position = client.player.vehicle ? client.player.vehicle.position : client.player.position;
	elements.setPosition('pickups', elementId, position);
};

cmds.savesphere = (client, _elementId) =>
{
	if(!client.player)
		return chat.notSpawned(client, client);
	
	var elementId = util.int(_elementId);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type a sphere ID.");
	
	if(!elements.isSphere(elementId))
		return chat.pm(client, 'Invalid sphere ID.');
	
	chat.all(client.name + ' updated the position for sphere ID ' + elementId + '.');
	
	var position = client.player.vehicle ? client.player.vehicle.position : client.player.position;
	elements.setPosition('spheres', elementId, position);
};

cmds.saveped = (client, _elementId) =>
{
	if(!client.player)
		return chat.notSpawned(client, client);
	
	var elementId = util.int(_elementId);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type a ped ID.");
	
	if(!elements.isPed(elementId))
		return chat.pm(client, 'Invalid ped ID.');
	
	chat.all(client.name + ' updated the position for ped ID ' + elementId + '.');
	
	var position = client.player.vehicle ? client.player.vehicle.position : client.player.position;
	elements.setPosition('peds', elementId, position);
};

cmds.saveblip = (client, _elementId) =>
{
	if(!client.player)
		return chat.notSpawned(client, client);
	
	var elementId = util.int(_elementId);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type a blip ID.");
	
	if(!elements.isBlip(elementId))
		return chat.pm(client, 'Invalid blip ID.');
	
	chat.all(client.name + ' updated the position for blip ID ' + elementId + '.');
	
	var position = client.player.vehicle ? client.player.vehicle.position : client.player.position;
	elements.setPosition('blips', elementId, position);
};







cmds.objectsyncer = (client, _elementId) =>
{
	var elementId = util.int(_elementId);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type an object ID.");
	
	if(!elements.isObject(elementId))
		return chat.pm(client, 'Invalid object ID.');
	
	var element = elements.getElement(elementId);
	if(element.syncer == -1)
		chat.all('There is no syncer for object ID ' + elementId + '.');
	else
		chat.all('The syncer for object ID ' + elementId + ' is ' + getClients()[element.syncer].name + '.');
};

cmds.vehiclesyncer = (client, _elementId) =>
{
	var elementId = util.int(_elementId);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type a vehicle ID.");
	
	if(!elements.isVehicle(elementId))
		return chat.pm(client, 'Invalid vehicle ID.');
	
	var element = elements.getElement(elementId);
	if(element.syncer == -1)
		chat.all('There is no syncer for vehicle ID ' + elementId + '.');
	else
		chat.all('The syncer for vehicle ID ' + elementId + ' is ' + getClients()[element.syncer].name + '.');
};

cmds.pickupsyncer = (client, _elementId) =>
{
	var elementId = util.int(_elementId);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type a pickup ID.");
	
	if(!elements.isPickup(elementId))
		return chat.pm(client, 'Invalid pickup ID.');
	
	var element = elements.getElement(elementId);
	if(element.syncer == -1)
		chat.all('There is no syncer for pickup ID ' + elementId + '.');
	else
		chat.all('The syncer for pickup ID ' + elementId + ' is ' + getClients()[element.syncer].name + '.');
};

cmds.spheresyncer = (client, _elementId) =>
{
	var elementId = util.int(_elementId);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type a sphere ID.");
	
	if(!elements.isSphere(elementId))
		return chat.pm(client, 'Invalid sphere ID.');
	
	var element = elements.getElement(elementId);
	if(element.syncer == -1)
		chat.all('There is no syncer for sphere ID ' + elementId + '.');
	else
		chat.all('The syncer for sphere ID ' + elementId + ' is ' + getClients()[element.syncer].name + '.');
};

cmds.pedsyncer = (client, _elementId) =>
{
	var elementId = util.int(_elementId);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type a ped ID.");
	
	if(!elements.isPed(elementId))
		return chat.pm(client, 'Invalid ped ID.');
	
	var element = elements.getElement(elementId);
	if(element.syncer == -1)
		chat.all('There is no syncer for ped ID ' + elementId + '.');
	else
		chat.all('The syncer for ped ID ' + elementId + ' is ' + getClients()[element.syncer].name + '.');
};

cmds.blipsyncer = (client, _elementId) =>
{
	var elementId = util.int(_elementId);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type a blip ID.");
	
	if(!elements.isBlip(elementId))
		return chat.pm(client, 'Invalid blip ID.');
	
	var element = elements.getElement(elementId);
	if(element.syncer == -1)
		chat.all('There is no syncer for blip ID ' + elementId + '.');
	else
		chat.all('The syncer for blip ID ' + elementId + ' is ' + getClients()[element.syncer].name + '.');
};









cmds.gotoobject = (client, _elementId) =>
{
	if(!client.player)
		return chat.notSpawned(client, client);
	
	var elementId = util.int(_elementId);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type an object ID.");
	
	if(!elements.isObject(elementId))
		return chat.pm(client, 'Invalid object ID.');
	
	var elementData = elements.getElementData('objects', elementId);
	if(!elementData)
		return chat.pm(client, 'Object not found.');
	
	chat.all(client.name + ' teleported to object ID ' + elementId + '.');
	var rotation = elementData.rotation;
	util.callClientFunction(client, 'generic.setLocalPlayerPositionRotation', elementData.position, rotation);
};

cmds.gotovehicle = (client, _elementId) =>
{
	if(!client.player)
		return chat.notSpawned(client, client);
	
	var elementId = util.int(_elementId);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type a vehicle ID.");
	
	if(!elements.isVehicle(elementId))
		return chat.pm(client, 'Invalid vehicle ID.');
	
	var elementData = elements.getElementData('vehicles', elementId);
	if(!elementData)
		return chat.pm(client, 'Vehicle not found.');
	
	chat.all(client.name + ' teleported to vehicle ID ' + elementId + '.');
	var rotation = elementData.rotation;
	util.callClientFunction(client, 'generic.setLocalPlayerPositionRotation', elementData.position, rotation);
};

cmds.gotopickup = (client, _elementId) =>
{
	if(!client.player)
		return chat.notSpawned(client, client);
	
	var elementId = util.int(_elementId);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type a pickup ID.");
	
	if(!elements.isPickup(elementId))
		return chat.pm(client, 'Invalid pickup ID.');
	
	var elementData = elements.getElementData('pickups', elementId);
	if(!elementData)
		return chat.pm(client, 'Pickup not found.');
	
	chat.all(client.name + ' teleported to pickup ID ' + elementId + '.');
	var rotation = new Vec3(0.0, 0.0, 0.0);
	util.callClientFunction(client, 'generic.setLocalPlayerPositionRotation', elementData.position, rotation);
};

cmds.gotosphere = (client, _elementId) =>
{
	if(!client.player)
		return chat.notSpawned(client, client);
	
	var elementId = util.int(_elementId);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type a sphere ID.");
	
	if(!elements.isSphere(elementId))
		return chat.pm(client, 'Invalid sphere ID.');
	
	var elementData = elements.getElementData('spheres', elementId);
	if(!elementData)
		return chat.pm(client, 'Sphere not found.');
	
	chat.all(client.name + ' teleported to sphere ID ' + elementId + '.');
	var rotation = new Vec3(0.0, 0.0, 0.0);
	util.callClientFunction(client, 'generic.setLocalPlayerPositionRotation', elementData.position, rotation);
};

cmds.gotoped = (client, _elementId) =>
{
	if(!client.player)
		return chat.notSpawned(client, client);
	
	var elementId = util.int(_elementId);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type a ped ID.");
	
	if(!elements.isPed(elementId))
		return chat.pm(client, 'Invalid ped ID.');
	
	var elementData = elements.getElementData('peds', elementId);
	if(!elementData)
		return chat.pm(client, 'Ped not found.');
	
	chat.all(client.name + ' teleported to ped ID ' + elementId + '.');
	var rotation = new Vec3(0.0, 0.0, elementsData.heading);
	util.callClientFunction(client, 'generic.setLocalPlayerPositionRotation', elementData.position, rotation);
};

cmds.gotoblip = (client, _elementId) =>
{
	if(!client.player)
		return chat.notSpawned(client, client);
	
	var elementId = util.int(_elementId);
	
	if(_elementId === undefined)
		return chat.pm(client, "You didn't type a blip ID.");
	
	if(!elements.islip(elementId))
		return chat.pm(client, 'Invalid blip ID.');
	
	var elementData = elements.getElementData('blips', elementId);
	if(!elementData)
		return chat.pm(client, 'Blip not found.');
	
	chat.all(client.name + ' teleported to blip ID ' + elementId + '.');
	var rotation = new Vec3(0.0, 0.0, 0.0);
	util.callClientFunction(client, 'generic.setLocalPlayerPositionRotation', elementData.position, rotation);
};









// objects
elements.addObject = (model, position, rotation) =>
{
	var element = elements.createObject(model, position, rotation);
	xml.element.add(elements.gamePath(elements.paths.objects), 'Object',
	{
		id:			element.id,
		model:		model,
		position:	util.posArray(position).join(','),
		rotation:	util.rotArray(rotation, true).join(',')
	});
	return element;
};
elements.removeObject = (elementId) =>
{
	destroyElement(getElementFromId(elementId));
	elements.removeElement('objects', elementId);
	xml.value.remove(elements.gamePath(elements.paths.objects), 'Object', 'id', elementId);
};
elements.createObject = (model, position, rotation) =>
{
	var element = gta.createObject(model, position);
	element.setRotation(rotation);
	elements.data.objects.push({
		id:			element.id,
		model:		model,
		position:	position,
		rotation:	rotation
	});
	return element;
};

elements.setObjectData = (elementId, model, position, rotation) =>
{
	elements.data.forEach(v =>
	{
		if(v.id == elementId)
		{
			v.position = position;
			v.rotation = rotation;
			v.model = model;
		}
	});
	xml.attr.set(elements.gamePath(elements.paths.objects), 'Object', {
		id:			elementId
	}, {
		model:		model,
		position:	util.posArray(position).join(','),
		rotation:	util.rotArray(rotation, true).join(',')
	});
};

// vehicles
elements.addVehicle = (model, position, rotation) =>
{
	var element = elements.createVehicle(model, position, rotation);
	xml.element.add(elements.gamePath(elements.paths.vehicles), 'Vehicle',
	{
		id:			element.id,
		model:		model,
		position:	util.posArray(position).join(','),
		rotation:	util.rotArray(rotation, true).join(',')
	});
	return element;
};
elements.removeVehicle = (elementId) =>
{
	destroyElement(getElementFromId(elementId));
	elements.removeElement('vehicles', elementId);
	xml.value.remove(elements.gamePath(elements.paths.vehicles), 'Vehicle', 'id', elementId);
};
elements.createVehicle = (model, position, rotation) =>
{
	var element = gta.createVehicle(model, position);
	element.setRotation(rotation);
	elements.data.vehicles.push({
		id:			element.id,
		model:		model,
		position:	position,
		rotation:	rotation
	});
	return element;
};

// pickups
elements.addPickup = (model, position) =>
{
	var element = elements.createPickup(model, position);
	xml.element.add(elements.gamePath(elements.paths.pickups), 'Pickup',
	{
		id:			element.id,
		model:		model,
		position:	util.posArray(position).join(',')
	});
	return element;
};
elements.removePickup = (elementId) =>
{
	destroyElement(getElementFromId(elementId));
	elements.removeElement('pickups', elementId);
	xml.value.remove(elements.gamePath(elements.paths.pickups), 'Pickup', 'id', elementId);
};
elements.createPickup = (model, position) =>
{
	var element = gta.createPickup(model, position);
	elements.data.pickups.push({
		id:			element.id,
		model:		model,
		position:	position
	});
	return element;
};

// spheres
elements.addSphere = (position, radius) =>
{
	var element = elements.createSphere(position, radius);
	xml.element.add(elements.gamePath(elements.paths.spheres), 'Sphere',
	{
		id:			element.id,
		position:	util.posArray(position).join(','),
		radius:		radius
	});
	return element;
};
elements.removeSphere = (elementId) =>
{
	destroyElement(getElementFromId(elementId));
	elements.removeElement('spheres', elementId);
	xml.value.remove(elements.gamePath(elements.paths.spheres), 'Sphere', 'id', elementId);
};
elements.createSphere = (position, radius) =>
{
	var element = gta.createSphere(position, radius);
	elements.data.spheres.push({
		id:			element.id,
		position:	position,
		radius:		radius
	});
	return element;
};

// blips
elements.addBlip = (icon, position, size, colour) =>
{
	var element = elements.createBlip(icon, position, size, 0xFF0025FF);
	xml.element.add(elements.gamePath(elements.paths.blips), 'Blip',
	{
		id:			element.id,
		icon:		icon,
		position:	util.posArray(position).join(','),
		size:		size,
		colour:		colour
	});
	return element;
};
elements.removeBlip = (elementId) =>
{
	destroyElement(getElementFromId(elementId));
	elements.removeElement('blips', elementId);
	xml.value.remove(elements.gamePath(elements.paths.blips), 'Blip', 'id', elementId);
};
elements.createBlip = (icon, position, size, colour) =>
{
	var element = gta.createBlip(icon, position, size, colour);
	element.position = position;
	elements.data.blips.push({
		id:			element.id,
		icon:		icon,
		position:	position,
		size:		size,
		colour:		colour
	});
	return element;
};

// peds
elements.addPed = (model, position, heading, pedType) =>
{
	var element = elements.createPed(model, position, heading, pedType);
	xml.element.add(elements.gamePath(elements.paths.peds), 'Ped',
	{
		id:			element.id,
		model:		model,
		position:	util.posArray(position).join(','),
		heading:	heading,
		pedType:	pedType
	});
	return element;
};
elements.removePed = (elementId) =>
{
	destroyElement(getElementFromId(elementId));
	elements.removeElement('peds', elementId);
	xml.value.remove(elements.gamePath(elements.paths.peds), 'Ped', 'id', elementId);
};
elements.createPed = (model, position, heading, pedType) =>
{
	var element = gta.createPed(model, position, pedType);
	element.heading = heading;
	elements.data.peds.push({
		id:			element.id,
		model:		model,
		position:	position,
		heading:	heading,
		pedType:	pedType
	});
	return element;
};



elements.isObject = (elementId) => elements.getElementData('objects', elementId) != null;
elements.isVehicle = (elementId) => elements.getElementData('vehicles', elementId) != null;
elements.isPickup = (elementId) => elements.getElementData('pickups', elementId) != null;
elements.isSphere = (elementId) => elements.getElementData('spheres', elementId) != null;
elements.isPed = (elementId) => elements.getElementData('peds', elementId) != null;
elements.isBlip = (elementId) => elements.getElementData('blips', elementId) != null;


// load elements
xml.load(elements.gamePath(elements.paths.objects), 'Object', (data) => elements.createObject(util.int(data.model), util.vec3(data.position), util.vec3Rot(data.rotation, true)));
xml.load(elements.gamePath(elements.paths.vehicles), 'Vehicle', (data) => elements.createVehicle(util.int(data.model), util.vec3(data.position), util.vec3Rot(data.rotation, true)));
xml.load(elements.gamePath(elements.paths.pickups), 'Pickup', (data) => elements.createPickup(util.int(data.model), util.vec3(data.position)));
xml.load(elements.gamePath(elements.paths.spheres), 'Sphere', (data) => elements.createSphere(util.vec3(data.position), util.float(data.radius)));
xml.load(elements.gamePath(elements.paths.peds), 'Ped', (data) => elements.createPed(util.int(data.model), util.vec3(data.position), util.float(data.heading), util.int(data.pedType)));
xml.load(elements.gamePath(elements.paths.blips), 'Blip', (data) => elements.createBlip(util.int(data.icon), util.vec3(data.position), util.int(data.size), util.int(data.colour)));

xml.save(elements.gamePath(elements.paths.objects), 'Object', elements.data.objects, elements.attr.objects);
xml.save(elements.gamePath(elements.paths.vehicles), 'Vehicle', elements.data.vehicles, elements.attr.vehicles);
xml.save(elements.gamePath(elements.paths.pickups), 'Pickup', elements.data.pickups, elements.attr.pickups);
xml.save(elements.gamePath(elements.paths.spheres), 'Sphere', elements.data.spheres, elements.attr.spheres);
xml.save(elements.gamePath(elements.paths.peds), 'Ped', elements.data.peds, elements.attr.peds);
xml.save(elements.gamePath(elements.paths.blips), 'Blip', elements.data.blips, elements.attr.blips);




