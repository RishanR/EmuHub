// Script that can be used to convert an array of Objects to a hashmap by a specific prop in each object of the array

const result = wiiu_db_json.reduce((map, obj) => {
  map[obj.titleid.replace(/-/g, '')] = {
    name: obj.name,
    region: obj.region,
  };
  return map;
}, {});

fs.writeFileSync(
  getAssetPath('wiiuReleasesHashMap.json'),
  JSON.stringify(result)
);
