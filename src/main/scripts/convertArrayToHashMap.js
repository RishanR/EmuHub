// Script that can be used to convert an array of Objects to a hashmap by a specific prop in each object of the array

const result = wiiuReleases_db_json_new.reduce((map, obj) => {
  map[obj.titleid] = { name: obj.name, region: obj.region, code: obj.code };
  return map;
}, {});

fs.writeFileSync(
  getAssetPath('wiiuReleasesHashMapNew.json'),
  JSON.stringify(result)
);
