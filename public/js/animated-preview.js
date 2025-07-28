/*

This file is shamelessly copied from Dress To Impress.
https://impress.openneo.net

Thanks Matchu!

*/

const canvas = document.getElementById("asset-canvas");
const libraryScript = document.getElementById("canvas-movie-library");
const libraryUrl = libraryScript.getAttribute("src");

// Read the asset ID from the URL, as an extra hint of what asset we're
// logging for. (This is helpful when there's a lot of assets animating!)
const assetId = document.location.pathname.split("/").at(-1);
const logPrefix = `[${assetId}] `.padEnd(9);

// State for controlling the movie.
let loadingStatus = "loading";
let playingStatus = getInitialPlayingStatus();

// State for loading the movie.
let library = null;
let movieClip = null;
let stage = null;

// State for animating the movie.
let frameRequestId = null;
let lastFrameTime = null;
let lastLogTime = null;
let numFramesSinceLastLog = 0;

// State for error reporting.
let hasLoggedRenderError = false;

////////////////////////////////////////////////////
//////// Loading the library and its assets ////////
////////////////////////////////////////////////////

function loadImage(src) {
	const image = new Image();
	image.crossOrigin = "anonymous";

	const promise = new Promise((resolve, reject) => {
		image.onload = () => {
			resolve(image);
		};
		image.onerror = () => {
			reject(new Error(`Failed to load image: ${JSON.stringify(src)}`));
		};
		image.src = src;
	});

	return promise;
}

async function getLibrary() {
	if (Object.keys(window.AdobeAn?.compositions || {}).length === 0) {
		throw new Error(
			`Movie library ${libraryUrl} did not add a composition to window.AdobeAn.compositions.`,
		);
	}
	const [compositionId, composition] = Object.entries(
		window.AdobeAn.compositions,
	)[0];
	if (Object.keys(window.AdobeAn.compositions).length > 1) {
		console.warn(
			`Grabbing composition ${compositionId}, but there are >1 here: `,
			Object.keys(window.AdobeAn.compositions).length,
		);
	}
	delete window.AdobeAn.compositions[compositionId];

	const library = composition.getLibrary();

	// One more loading step as part of loading this library is loading the
	// images it uses for sprites.
	//
	// NOTE: We also read these from the manifest, and include them in the
	//       document as preload meta tags, to get them moving faster.
	const librarySrcDir = libraryUrl.split("/").slice(0, -1).join("/");
	const manifestImages = new Map(
		library.properties.manifest.map(({ id, src }) => [
			id,
			loadImage(librarySrcDir + "/" + src),
		]),
	);

	await Promise.all(manifestImages.values());

	// Finally, once we have the images loaded, the library object expects us to
	// mutate it (!) to give it the actual image and sprite sheet objects from
	// the loaded images. That's how the MovieClip's internal JS objects will
	// access the loaded data!
	const images = composition.getImages();
	for (const [id, image] of manifestImages.entries()) {
		images[id] = await image;
	}
	const spriteSheets = composition.getSpriteSheet();
	for (const { name, frames } of library.ssMetadata) {
		const image = await manifestImages.get(name);
		spriteSheets[name] = new window.createjs.SpriteSheet({
			images: [image],
			frames,
		});
	}

	return library;
}

/////////////////////////////////////
//////// Rendering the movie ////////
/////////////////////////////////////

function buildMovieClip(library) {
	let constructorName;
	try {
		const fileName = decodeURI(libraryUrl).split("/").pop();
		const fileNameWithoutExtension = fileName.split(".")[0];
		constructorName = fileNameWithoutExtension.replace(/[ -]/g, "");
		if (constructorName.match(/^[0-9]/)) {
			constructorName = "_" + constructorName;
		}
	} catch (e) {
		throw new Error(
			`Movie libraryUrl ${JSON.stringify(libraryUrl)} did not match expected ` +
				`format: ${e.message}`,
		);
	}

	const LibraryMovieClipConstructor = library[constructorName];
	if (!LibraryMovieClipConstructor) {
		throw new Error(
			`Expected JS movie library ${libraryUrl} to contain a constructor ` +
				`named ${constructorName}, but it did not: ${Object.keys(library)}`,
		);
	}
	const movieClip = new LibraryMovieClipConstructor();

	return movieClip;
}

function updateStage() {
	try {
		stage.update();
	} catch (e) {
		// If rendering the frame fails, log it and proceed. If it's an
		// animation, then maybe the next frame will work? Also alert the user,
		// just as an FYI. (This is pretty uncommon, so I'm not worried about
		// being noisy!)
		if (!hasLoggedRenderError) {
			console.error(`Error rendering movie clip ${libraryUrl}`, e);
			// TODO: Inform user about the failure
			hasLoggedRenderError = true;
		}
	}
}

function updateCanvasDimensions() {
	// Set the canvas's internal dimensions to be higher, if the device has high
	// DPI. Scale the movie clip to match, too.
	const internalWidth = canvas.offsetWidth * window.devicePixelRatio;
	const internalHeight = canvas.offsetHeight * window.devicePixelRatio;
  canvas.style.backgroundColor = "transparent";
	canvas.width = internalWidth;
	canvas.height = internalHeight;
	movieClip.scaleX = internalWidth / library.properties.width;
	movieClip.scaleY = internalHeight / library.properties.height;
}

window.addEventListener("resize", () => {
	updateCanvasDimensions();

	// Redraw the stage with the new dimensions - but with `tickOnUpdate` set
	// to `false`, so that we don't advance by a frame. This keeps us
	// really-paused if we're paused, and avoids skipping ahead by a frame if
	// we're playing.
	stage.tickOnUpdate = false;
	updateStage();
	stage.tickOnUpdate = true;
});

////////////////////////////////////////////////////
//// Monitoring and controlling animation state ////
////////////////////////////////////////////////////

async function startMovie() {
	// Load the movie's library (from the JS file already run), and use it to
	// build a movie clip.
	library = await getLibrary();
	movieClip = buildMovieClip(library);

	updateCanvasDimensions();

	if (canvas.getContext("2d") == null) {
		console.warn(`Out of memory, can't use canvas for ${libraryUrl}.`);
		// TODO: "Too many animations!"
		return;
	}

	stage = new window.createjs.Stage(canvas);
	stage.addChild(movieClip);
	updateStage();

	loadingStatus = "loaded";
	canvas.setAttribute("data-status", "loaded");

	updateAnimationState();
}

function updateAnimationState() {
	const shouldRunAnimations =
		loadingStatus === "loaded" && playingStatus === "playing";

	if (shouldRunAnimations && frameRequestId == null) {
		lastFrameTime = document.timeline.currentTime;
		lastLogTime = document.timeline.currentTime;
		numFramesSinceLastLog = 0;
		documentHiddenSinceLastFrame = document.hidden;
		frameRequestId = requestAnimationFrame(onAnimationFrame);
	} else if (!shouldRunAnimations && frameRequestId != null) {
		cancelAnimationFrame(frameRequestId);
		lastFrameTime = null;
		lastLogTime = null;
		numFramesSinceLastLog = 0;
		documentHiddenSinceLastFrame = false;
		frameRequestId = null;
	}
}

function onAnimationFrame() {
	const targetFps = library.properties.fps;
	const msPerFrame = 1000 / targetFps;
	const msSinceLastFrame = document.timeline.currentTime - lastFrameTime;
	const msSinceLastLog = document.timeline.currentTime - lastLogTime;

	// If it takes too long to render a frame, cancel the movie, on the
	// assumption that we're riding the CPU too hard. (Some movies do this!)
	//
	// But note that, if the page is hidden (e.g. the window is not visible),
	// it's normal for the browser to pause animations. So, if we detected that
	// the document became hidden between this frame and the last, no
	// intervention is necesary.
	if (msSinceLastFrame >= 2000 && !documentHiddenSinceLastFrame) {
		pause();
		console.warn(`Paused movie for taking too long: ${msSinceLastFrame}ms`);
		// TODO: Display message about low FPS, and sync up to the parent.
		return;
	}

	if (msSinceLastFrame >= msPerFrame) {
		updateStage();
		lastFrameTime = document.timeline.currentTime;

		// If we're a little bit late to this frame, probably because the frame
		// rate isn't an even divisor of 60 FPS, backdate it to what the ideal time
		// for this frame *would* have been. (For example, without this tweak, a
		// 24 FPS animation like the Floating Negg Faerie actually runs at 20 FPS,
		// because it wants to run every 41.66ms, but a 60 FPS browser checks in
		// every 16.66ms, so the best it can do is 50ms. With this tweak, we can
		// *pretend* we ran at 41.66ms, so that the next frame timing correctly
		// takes the extra 9.33ms into account.)
		const msFrameDelay = msSinceLastFrame - msPerFrame;
		if (msFrameDelay < msPerFrame) {
			lastFrameTime -= msFrameDelay;
		}

		numFramesSinceLastLog++;
	}

	if (msSinceLastLog >= 5000) {
		const fps = numFramesSinceLastLog / (msSinceLastLog / 1000);
		console.debug(`${logPrefix} FPS: ${fps.toFixed(2)} (Target: ${targetFps})`);
		lastLogTime = document.timeline.currentTime;
		numFramesSinceLastLog = 0;
	}

	frameRequestId = requestAnimationFrame(onAnimationFrame);
	documentHiddenSinceLastFrame = document.hidden;
}

// If `document.hidden` becomes true at any point, log it for the next
// animation frame. (The next frame will reset the state, as will starting or
// stopping the animation.)
document.addEventListener("visibilitychange", () => {
	if (document.hidden) {
		documentHiddenSinceLastFrame = true;
	}
});

function play() {
	playingStatus = "playing";
	updateAnimationState();
}

function pause() {
	playingStatus = "paused";
	updateAnimationState();
}

function getInitialPlayingStatus() {
	const params = new URLSearchParams(document.location.search);
	if (params.has("playing")) {
		return "playing";
	} else {
		return "paused";
	}
}

//////////////////////////////////////////
//// Syncing with the parent document ////
//////////////////////////////////////////

/**
 * Recursively scans the given MovieClip (or child createjs node), to see if
 * there are any animated areas.
 */
function hasAnimations(createjsNode) {
	return (
		// Some nodes have simple animation frames.
		createjsNode.totalFrames > 1 ||
		// Tweens are a form of animation that can happen separately from frames.
		// They expect timer ticks to happen, and they change the scene accordingly.
		createjsNode?.timeline?.tweens?.length >= 1 ||
		// And some nodes have _children_ that are animated.
		(createjsNode.children || []).some(hasAnimations)
	);
}

function sendStatus() {
	if (loadingStatus === "loading") {
		sendMessage({ type: "status", status: "loading" });
	} else if (loadingStatus === "loaded") {
		sendMessage({
			type: "status",
			status: "loaded",
			hasAnimations: hasAnimations(movieClip),
		});
	} else if (loadingStatus === "error") {
		sendMessage({ type: "status", status: "error" });
	} else {
		throw new Error(
			`unexpected loadingStatus ${JSON.stringify(loadingStatus)}`,
		);
	}
}

function sendMessage(message) {
	parent.postMessage(message, document.location.origin);
}

window.addEventListener("message", ({ data }) => {
	// NOTE: For more sensitive messages, it's important for security to also
	// check the `origin` property of the incoming event. But in this case, I'm
	// okay with whatever site is embedding us being able to send play/pause!
	if (data.type === "play") {
		play();
	} else if (data.type === "pause") {
		pause();
	} else if (data.type === "requestStatus") {
		sendStatus();
	} else {
		// throw new Error(`unexpected message: ${JSON.stringify(data)}`);
	}
});

/////////////////////////////////
//// The actual entry point! ////
/////////////////////////////////

startMovie()
	.then(() => {
		sendStatus();
	})
	.catch((error) => {
		console.error(logPrefix, error);

		loadingStatus = "error";
		sendStatus();

		// If loading the movie fails, show the fallback image instead, by moving
		// it out of the canvas content and into the body.
		document.body.appendChild(document.getElementById("fallback"));
		console.warn("Showing fallback image instead.");
	});