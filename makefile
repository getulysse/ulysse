build:
	@ echo '{"main":"dist/index.js","output":"sea-prep.blob","disableExperimentalSEAWarning":true}' > sea-config.json
	@ npm run build
	@ node --experimental-sea-config sea-config.json
	@ cp ~/.asdf/installs/nodejs/22.14.0/bin/node ulysse
	@ npx postject ulysse NODE_SEA_BLOB sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
	@ rm sea-prep.blob sea-config.json
