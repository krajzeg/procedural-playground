procedural-playground
=====================

Procedural planet generation playground.

## How to set it up

1. Clone the repository: `git clone https://github.com/krajzeg/procedural-playground.git`
2. Open `index.html` and enjoy the dull gray ball.

### Chrome users 

You **will get security errors** if you open index.html directly, so you have to set up a server in the root directory of the project:

* if you have node.js: `node serve.js`
* if you have python: `python -m SimpleHTTPServer`

Then, navigate to [http://localhost:8000](http://localhost:8000) to get it to work.

## Working on the project

Open `js/playground/main.js` - all procedural generation code goes in there. 

If you get lost, the `step-N-blah-blah.js` files contain step-by-step solutions for everything we will be doing, so you can just copy them over `main.js` to get back on track.



