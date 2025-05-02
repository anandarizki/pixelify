"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Lexend } from "next/font/google";
import { Copy, Download, Upload } from "lucide-react";

import { motion } from "framer-motion";

const MAX_GRID = 128;

const contentFont = Lexend({
  subsets: ["latin"],
  weight: ["400", "500", "500", "700"],
});

const palettes = {
  bgAccent: "bg-[#F6F740] text-black",
  textAccent: "text-[#F6F740]",
  bgLight: "bg-[#f1faee] text-black",
  bgDark: "bg-[#46C7B8] text-white",
};

// Helper function to convert RGB to HEX
const rgbToHex = (r: number, g: number, b: number): string => {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
};

//helper for toast
const notify = (msg: string) => toast(msg);

//helper to generate html content
const generateText = (colors: string[], dimension: number) => {
  let pixelStyle = ``;
  let pixelDiv = ``;

  for (let i = 0; i <= colors.length; i++) {
    pixelStyle += `.px${i + 1}{background-color: ${colors[i]}} `;
    pixelDiv += `<div class="px px${i + 1}"></div> `;
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Pixel Art</title><style>* {padding: 0;margin: 0;} .wrapper{display:grid;grid-template-columns:repeat(${dimension},1fr);grid-template-columns:repeat(${dimension},1fr);}.px{ aspect-ratio: 1 / 1;}${pixelStyle}</style>
  </head><body><div class="wrapper">${pixelDiv}</div></body></html>`;
};

//Preview Component
const PixelPreview = ({
  colors,
  dimension,
}: {
  colors: string[];
  dimension: number;
}) => {
  const [localColors, setLocalColors] = useState(colors);
  const [localDimension, setLocalDimension] = useState(dimension);

  useEffect(() => {
    const handler = setTimeout(() => {
      setLocalColors(colors);
      setLocalDimension(dimension);
    }, 300);

    return () => clearTimeout(handler);
  }, [colors, dimension]);
  return (
    <div
      className="grid w-full"
      style={{
        gridTemplateColumns: `repeat(${localDimension},1fr)`,
        gridTemplateRows: `repeat(${localDimension},1fr)`,
      }}
    >
      {localColors.map((color, index) => (
        <div
          className="aspect-square"
          key={localDimension + color + index}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
};

//Input Range

function Range({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) {
  const percentage = ((value - 2) / (MAX_GRID - 2)) * 100;
  return (
    <div className={`relative h-4 w-full`}>
      <div className="absolute shadow-md inset-x-0 h-3 top-1/2 -translate-y-1/2 bg-white/20 rounded-full" />
      <div
        className={`absolute inset-y-0 h-3 left-0 top-1/2 -translate-y-1/2 ${palettes.bgDark} rounded-full pointer-events-none`}
        style={{ width: `${percentage}%` }}
      />

      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 bg-white rounded-full pointer-events-none"
        style={{ left: `calc(${percentage}%)` }}
      />
      <input
        type="range"
        min={2}
        max={MAX_GRID}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  );
}
export default function PixelArtConverter() {
  const [image, setImage] = useState<string | null>(null);
  const [gridDimension, setGridDimension] = useState<number>(16);
  const [colorData, setColorData] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const pixelateImage = (dimension: number) => {
    if (!image || !canvasRef.current || !pixelCanvasRef.current) return;

    const canvas = canvasRef.current;
    const pixelCanvas = pixelCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const pixelCtx = pixelCanvas.getContext("2d");

    if (!ctx || !pixelCtx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image;

    img.onload = () => {
      const size = 100;
      canvas.width = size;
      canvas.height = size;

      const outputSize = 100;
      pixelCanvas.width = outputSize;
      pixelCanvas.height = outputSize;

      // Calculate center position
      const scale = Math.min(size / img.width, size / img.height);
      const x = (size - img.width * scale) / 2;
      const y = (size - img.height * scale) / 2;
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      // Put image on the center of canvas
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

      // Calculate pixel size
      const cellSize = outputSize / dimension;
      pixelCtx.clearRect(0, 0, outputSize, outputSize);

      const newColorData: string[] = [];

      // Get color of each pixel
      for (let y = 0; y < dimension; y++) {
        for (let x = 0; x < dimension; x++) {
          const sourceX = x * cellSize + cellSize / 2;
          const sourceY = y * cellSize + cellSize / 2;

          const pixelData = ctx.getImageData(sourceX, sourceY, 1, 1).data;

          const hexColor = rgbToHex(pixelData[0], pixelData[1], pixelData[2]);
          newColorData.push(hexColor);
        }
      }

      setColorData(newColorData);
    };
  };

  const getTextData = () => generateText(colorData, gridDimension);

  useEffect(() => {
    //implement debounce mechanism for performance purpose
    if (image) {
      pixelateImage(gridDimension);
    }
  }, [image, gridDimension]);

  const copyHTML = () => {
    const dataStr = getTextData();
    navigator.clipboard
      .writeText(dataStr)
      .then(() => {
        notify("The HTML code has been copied");
      })
      .catch((err) => {
        console.error("Copy failed: ", err);
        alert("Failed to copy the HTML code, copy manually instead.");
      });
  };

  const downloadHTML = () => {
    try {
      const htmlContent = getTextData();
      const blob = new Blob([htmlContent], { type: "text/html" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "pixel-art.html";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert("Failed to download the HTML code, copy manually instead.");
    }
  };

  const uploadButton = (
    <motion.div
      initial={{ opacity: 0, translateY: 40 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: 0.2 }}
      className="m-auto w-full"
    >
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => fileInputRef.current?.click()}
        className={`${palettes.bgDark} cursor-pointer text-shadow text-xl font-bold py-3 px-10 flex items-center gap-2 justify-center m-auto rounded-lg`}
      >
        <Upload /> <span>{image ? "Upload New Image" : "Upload Image"}</span>
      </motion.button>
    </motion.div>
  );

  return (
    <div
      className={`${contentFont.className} px-6 py-10 text-white flex flex-col items-center justify-center min-h-screen
    w-full h-full bg-slate-950
                  bg-[linear-gradient(45deg,rgba(255,255,255,.05)_25%,transparent_25%),linear-gradient(135deg,rgba(255,255,255,.05)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,rgba(255,255,255,.05)_75%),linear-gradient(135deg,transparent_75%,rgba(255,255,255,.05)_75%)]
                  bg-[size:50px_50px]
                  bg-[position:0_0,25px_0,25px_-25px,0px_25px]`}
    >
      <div className="container mx-auto max-w-6xl py-8 px-4">
        <div className="text-center flex flex-col justify-center items-center m-auto  max-w-xl">
          <motion.h1
            layout
            initial={{ opacity: 0, translateY: 40 }}
            animate={{ opacity: 1, translateY: 0 }}
            className={` tracking-tighter ${
              image ? "text-6xl md:text-7xl" : "text-7xl md:text-8xl"
            } mb-4 font-extrabold text-center ${palettes.textAccent}`}
          >
            Pixelify
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, translateY: 40 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 0.1 }}
            className={`${
              image ? "text-lg md:text-xl" : "text-xl md:text-2xl"
            }  opacity-80`}
          >
            {image
              ? "What a nice image! Now you can modify the dimension."
              : "Convert your picture into a pixel art, and get results in an HTML page."}
          </motion.p>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            ref={fileInputRef}
          />
          {!image && <div className="mt-10">{uploadButton}</div>}
        </div>

        {image && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
            <motion.div
              initial={{ translateX: "-100%", opacity: 0 }}
              animate={{ translateX: "0%", opacity: 1 }}
              transition={{ ease: "linear", delay: 0.4 }}
              className="rounded-2xl p-4 bg-white/20 backdrop-blur-sm"
            >
              <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                <img
                  src={image}
                  alt="Original"
                  className="w-full block h-full max-w-full max-h-full object-contain"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ translateX: "100%", opacity: 0 }}
              animate={{ translateX: "0%", opacity: 1 }}
              transition={{ ease: "linear", delay: 0.4 }}
              className="rounded-2xl p-4 bg-white/20 backdrop-blur-sm"
            >
              <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                <PixelPreview colors={colorData} dimension={gridDimension} />
              </div>
            </motion.div>

            <motion.div
              initial={{ translateY: "100%", opacity: 0 }}
              animate={{ translateY: "0%", opacity: 1 }}
              transition={{ ease: "linear", delay: 0.4 }}
              className="rounded-2xl flex items-center gap-2 p-4 px-6 bg-white/20 backdrop-blur-sm md:col-span-2"
            >
              <div>Dimension</div>

              <div className="flex-1">
                <Range value={gridDimension} onChange={setGridDimension} />
              </div>
              <div>
                {gridDimension} x {gridDimension}
              </div>
            </motion.div>

            <motion.div
              initial={{ translateY: 20, opacity: 0 }}
              animate={{ translateY: 0, opacity: 1 }}
              transition={{ ease: "linear", delay: 0.4 }}
              className="rounded-2xl p-4 px-6 bg-white/20 backdrop-blur-sm md:col-span-2"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-xl">Your HTML Code</h2>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`${palettes.bgAccent} p-2 rounded-lg cursor-pointer`}
                    onClick={copyHTML}
                  >
                    <Copy className="h-5 w-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`${palettes.bgDark} p-2 rounded-lg cursor-pointer`}
                    onClick={downloadHTML}
                  >
                    <Download className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>
              <div className="rounded-lg overflow-hidden">
                <textarea
                  value={getTextData()}
                  className="text-sm focus:outline-none focus:ring-0 font-mono text-gray-300  h-60 bg-black p-6 w-full"
                />
              </div>
            </motion.div>

            {image && (
              <div className="flex justify-center md:col-span-2 w-full mb-10">
                {uploadButton}
              </div>
            )}
          </div>
        )}
  <div className="text-xs mt-20 opacity-60 text-white md:col-span-2 text-center">By <a href="https://rizki.id" target="_blank">Ananda Rizki</a></div>
          
        {/* Hidden canvas for processing the image */}
        <div className="hidden">
          <canvas ref={canvasRef}></canvas>
          <canvas ref={pixelCanvasRef}></canvas>
        </div>
      </div>
      <Toaster
        toastOptions={{
          duration: 1500,
          style: {
            background: "white",
            color: "black",
          },
        }}
      />
    </div>
  );
}
