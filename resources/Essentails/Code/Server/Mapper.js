global.mapper = {};

mapper.maps = [];

// events
bindEventHandler('onResourceStart', thisResource, function()
{
	//mapper.loadAllMaps();
});

mapper.storeActiveObject = (client, objectId, modelId, position, rotation) =>
{
	if(!accounts.isClientAuthorized(client))
		return;

	if(!mapper.isEnabled(client))
		return;
	
	if(!util.isIntValue(objectId))
		return;

	if(!util.isIntValue(modelId))
		return;

	if(!util.isVec3Value(position))
		return;

	if(!util.isVec3Value(rotation))
		return;

	if(elements.isObject(objectId))
		elements.setObjectData(objectId, modelId, position, rotation);
	else
		elements.addObject(modelId, position, rotation);
};

// commands
cmds.mapper = (client, _model) =>
{
	if(!client.player)
		return chat.notSpawned(client, client);
	
	if(mapper.isEnabled(client))
	{
		mapper.setDisabled(client);
	}
	else
	{
		var model = _model ? util.int(_model) : 583/*util.getMinObjectModel()*/;
		mapper.setEnabled(client, model);
	}
};










// map editor
mapper.isEnabled = (client) =>
{
	return cd.get(client, 'mapper') == 1;
};

mapper.setEnabled = (client, model) =>
{
	if(removeMode.isAnyRemoveModeEnabled(client))
		removeMode.disableRemoveMode(client);
	
	cd.set(client, 'mapper', 1);
	util.callClientFunction(client, 'mapper.setEnabled', model);
};

mapper.setDisabled = (client) =>
{
	cd.set(client, 'mapper', 0);
	util.callClientFunction(client, 'mapper.setDisabled');
};

mapper.toggleEnabled = (client) =>
{
};

// map existence
mapper.addMap = function(mapName)
{
	var map = {
		name: mapName,
		objects: []
	};
	mapper.maps.push(map);
	return map;
};

// all maps
mapper.loadAllMaps = function()
{
};

// map
mapper.getMapPath = function(mapName)
{
	return 'Data/' + util.getCurrentShortGameName() + '/Maps/'+mapName+'.txt';
};

mapper.loadMap = function(mapName)
{
	var lines = utility.getFileLines(openFile(mapper.getMapPath(mapName)));
	var map = mapper.addMap(mapName);
	for(var i in lines)
	{
		var data = lines[i].split("\t");
		
		if(data[0].toLowerCase() == 'object')
		{
			var object = mapper.loadMapObject(data);
			if(object)
			{
				map.objects.push(object);
			}
		}
	}
};

mapper.unloadMap = function()
{
};

mapper.loadMapObject = function(data)
{
	if(data.length < 5)
		return false;
	
	var object = gta.createObject(
		parseInt(data[1]),
		new Vec3(
			parseFloat(data[2]),
			parseFloat(data[3]),
			parseFloat(data[4])
		)
	);
	if(!object)
		return false;
	
	if(data.length >= 8)
	{
		object.setRotation(new Vec3(
			parseFloat(data[5]),
			parseFloat(data[6]),
			parseFloat(data[7])
		));
	}
	
	return object;
};

