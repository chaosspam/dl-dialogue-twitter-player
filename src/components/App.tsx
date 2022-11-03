import "./App.css";
import React from "react";

import {
  drawDialogueScreen,
  wrapLines,
  canvas,
} from "../helper/dragalia_canvas";

import { DialogueType, Emotion, Layer, Settings } from "../types/data";
import {
  FunctionComponent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";


export interface LayerOperations {
  removeLayer: (id: number) => void;
  updateLayer: (updateLayerId: number | undefined, updated: any) => void;
}

let layerId = 0;
let transition = false;
let interrupt = false;
const CHARACTER_DELAY = 0.2;

const sfxClick = require('../audio/sound/ui/touch.wav');
const bgm = require('../audio/music/bgm_utopia.mp3');

const urlParams = new URLSearchParams(window.location.search);

const nameParam = urlParams.get('name');
const speakerName = nameParam !== null ? nameParam : "Rita";

const bgParam = urlParams.get('bg');
const backgroundSrc = bgParam !== null ? bgParam : "images/bg.png";

const ptParam = urlParams.get('pt');
const portraitSrc = ptParam !== null ? ptParam : "images/rt.png";

const textListParam = urlParams.get('dia');
let textList = [
  "Guys, guys, so um yesterday I learned that it is possible to like put a game in the Twitter player thing.",
  "And I got like this cool idea where you can like embed a dl-dialogue-generator canvas in there.",
  "Then I just did it... though it seems like it only works on desktop.",
  "Or if you are one of the weird people that browse Twitter on a browser instead of an app it works there as well.",
  "If you are on the app it should open like a little in app browser, so it's like not as cool I guess...",
  "Anyways, I don't really have a plan for this, was just like a cool idea I spent like an hour on.",
  "But who knows lol, Dragalia dialogue generator was also like a cool idea like an year ago."
]

try {
  if(textListParam !== null) {
    let parsed = JSON.parse(textListParam);
    if(!Array.isArray(textList)) {
      throw new Error("Parameter is not array");
    } else {
      textList = parsed;
    }
  }
}
catch(e) {
  console.error("JSON parse failed");
}

console.log(backgroundSrc);
console.log(portraitSrc);
console.log(textList);

let index = 0;

const App: FunctionComponent = () => {
  const previewRef = useRef(null);

  const [layers, setLayers] = useState<Layer[]>([
    newLayer(
      'background',
      backgroundSrc
    ),
    newLayer(
      'portrait',
      portraitSrc
    ),
  ]);

  const [settings, setSettings] = useState<Settings>({
    speaker: '',
    dialogueText: "Click / Tap to start",
    dialogueType: DialogueType.Dialogue,
    font: 'en',
    emotion: Emotion.None,
    emotionIsLeft: true,
    emotionOffsetX: 0,
    emotionOffsetY: 0,
  });

  // Memoize draw call
  const updateDraw = useCallback(() => {
    if (previewRef && previewRef.current) {
      drawDialogueScreen(settings, layers, previewRef.current);
    } else {
      drawDialogueScreen(settings, layers);
    }
  }, [settings, layers, previewRef]);

  useEffect(() => {
    updateDraw();
  }, [layers, settings, updateDraw]);

  /**
   * Add a new layer
   * @param {string} layerName - Name of the new layer to add
   * @param {string} imgSrc - Image source for the new layer
   */
  function addLayer(layerName: string, imgSrc: string): Layer {
    const toAdd = newLayer(layerName, imgSrc);
    setLayers([...layers, toAdd]);
    return toAdd;
  }

  /**
   * Returns a new layer object
   * @param {string} layerName - Name of the new layer to add
   * @param {string} imgSrc - Image source for the new layer
   */
  function newLayer(layerName: string, imgSrc: string): Layer {
    // Get a new id
    const layerId = getNewId();
    const image = new Image();
    image.src = imgSrc;

    // Create data for new layer
    let newLayer: Layer = {
      name: layerName,
      id: layerId,
      image: image,
      src: imgSrc,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      scale: 1,
      opacity: 1,
      flipX: false,
      filter: "",
    };

    return newLayer;
  }

  /**
   * Remove the layer that is set to be removed
   */
  function removeLayer(id: number) {
    if (layers.length <= 1) return;
    setLayers(layers.filter((layer) => layer.id !== id));
  }

  function updateLayer(updateLayerId: number | undefined, updated: Layer) {
    setLayers((prevLayers) =>
      prevLayers.map((layer) =>
        layer.id === updateLayerId ? Object.assign({}, layer, updated) : layer
      )
    );
  }

  function updateSettings(updated: any) {
    setSettings((prevSettings) => Object.assign({}, prevSettings, updated));
  }


  const layerOperations: LayerOperations = {
    updateLayer,
    removeLayer,
  };

  async function tryPlayNextFrame() {
    if(transition) { interrupt = true; return; }
    transition = true;
    let nextText = wrapLines(textList[index], DialogueType.Dialogue, 'en');
    let toSet = "";
    for(let i = 0; i < nextText.length; i++) {
      if(!interrupt) {
        toSet += nextText[i];
        updateSettings({speaker: speakerName, dialogueText: toSet});
        await timeout(CHARACTER_DELAY);
      }
      else {
        updateSettings({speaker: speakerName, dialogueText: nextText});
        interrupt = false;
        break;
      }
    }
    index = (index + 1) % textList.length;
    transition = false;
  }

  const audioSound = useRef<HTMLAudioElement>(null);
  const audioMusic = useRef<HTMLAudioElement>(null);

  function playSound() {
    if(audioSound.current !== null) {
      audioSound.current.currentTime = 0;
      audioSound.current.play();
    }
  }

  function playMusic() {
    if(audioMusic.current !== null) {
      audioMusic.current.play();
    }
  }

  async function timeout(delay: number) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  return (
      <>
        <canvas
          ref={previewRef}
          width="500"
          height="890"
          onClick={(e) => {
            playSound();
            playMusic();
            tryPlayNextFrame();
          }}
        >
        </canvas>
        <audio src={sfxClick} ref={audioSound}></audio>
        <audio src={bgm} ref={audioMusic} loop></audio>
      </>
  );
};

/**
 * Generate a new id to associate with a new layer
 * @returns {number} A new number id
 */
function getNewId() {
  layerId++;
  return layerId;
}

export default App;
