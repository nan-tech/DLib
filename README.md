# DLib
Library for interacting with nan-tech's displacement database

# Building
`npm install`
`npm run-script build`

The gory details of the build script:
1. Build typescript decrelations
2. Compile typescript with Babel
3. Browserify babel output
4. Bundle the library into a single .js file 'dist.js' in the directory 'lib'
