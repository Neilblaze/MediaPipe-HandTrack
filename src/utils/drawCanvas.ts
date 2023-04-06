import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS, NormalizedLandmarkListList, Results } from '@mediapipe/hands';


function calcDistance(x1: number, y1: number, x2: number, y2: number) {
	const dist = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
	return dist
}

function calcCentroid(points: any[]) {
	let centerX = 0
	let centerY = 0
	let xSum = 0
	let ySum = 0
	for (let i = 0; i < points.length; i++) {
		xSum += points[i][0]
		ySum += points[i][1]
	}
	centerX = xSum / points.length
	centerY = ySum / points.length
	return [centerX, centerY]
}


class ResultsManager {
	resultsArr: any[]
	resultsWorldArr: any[]
	rotationMat: any

	constructor(resultsArr: any[], resultsWorldArr?: any[]) {
		this.resultsArr = resultsArr
		this.resultsWorldArr = resultsWorldArr ? resultsWorldArr : [undefined, undefined, undefined]
	}

	setResultsArr(currResults: any) {
		this.resultsArr = [...this.resultsArr.slice(1, 3), currResults]
	}

	setResultsWorldArr(currResults: any) {
		this.resultsWorldArr = [...this.resultsWorldArr.slice(1, 3), currResults]
	}
}

class CubeTracker {
	x: number
	y: number
	wx: number
	wy: number
	h: number
	color: string
	strokeColor: string
	// circum circle properties
	cx: number
	cy: number
	r: number
	r1: number
	r2: number

	constructor(x: number, y: number, wx: number, wy: number, h: number, color: string, strokeColor: string) {
		this.x = x
		this.y = y
		this.wx = wx
		this.wy = wy
		this.h = h
		this.color = color
		this.strokeColor = strokeColor
		let [x1, y1, r] = this.circumCircle()
		this.cx = x1
		this.cy = y1
		this.r = r
		this.r1 = r + h
		this.r2 = r - h
	}

	translate(xDeviation: number, yDeviation: number) {
		this.x += xDeviation
		this.y += yDeviation
		this.cx += xDeviation
		this.cy += yDeviation
	}

	circumCircle() {
		const [x1, y1] = [this.x - this.wx, this.y - this.wx * 0.5]
		const [x2, y2] = [this.x + this.wy, this.y - this.h - this.wy * 0.5]
		const x = (x1 + x2) / 2
		const y = (y1 + y2) / 2
		const r = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)) / 2
		return [x, y, r]
	}

	resetCubeTracker() {
		this.x = 320
		this.y = 280
		this.wx = 50
		this.wy = 50
		this.h = 50
		this.color = '#ff8200'
		let [x1, y1, r] = this.circumCircle()
		this.cx = x1
		this.cy = y1
		this.r = r
		this.r1 = r + this.h
		this.r2 = r - this.h
	}
}

export const resetCubeTracker = () => {
	cubeTracker.resetCubeTracker()
}

let rsm = new ResultsManager([undefined, undefined, undefined])
let cubeTracker = new CubeTracker(300, 300, 50, 50, 50, '#ff8200', '#ff6000')


function calcTranslation(width: number, height: number) {
	if (rsm.resultsArr !== undefined && rsm.resultsArr.length > 2) {
		// console.log(rsm.resultsWorldArr)
		let curr: any = rsm.resultsArr[2]
		let prev: any = rsm.resultsArr[1]

		// console.log(curr, prev)
		if (curr !== undefined && prev !== undefined) {
			if (curr.length > 0 && prev.length > 0) {
				let mat1 = [
					[prev[0][4].x * width, prev[0][4].y * height, prev[0][4].z * height],
					[prev[0][8].x * width, prev[0][8].y * height, prev[0][8].z * height],
					[prev[0][12].x * width, prev[0][12].y * height, prev[0][12].z * height],
					[prev[0][20].x * width, prev[0][20].y * height, prev[0][20].z * height]
				]

				let mat2 = [
					[curr[0][4].x * width, curr[0][4].y * height, curr[0][4].z * height],
					[curr[0][8].x * width, curr[0][8].y * height, curr[0][8].z * height],
					[curr[0][12].x * width, curr[0][12].y * height, curr[0][12].z * height],
					[curr[0][20].x * width, curr[0][20].y * height, curr[0][20].z * height]
				]

				const [cxPrev, cyPrev] = calcCentroid(mat1)
				const [cxCurr, cyCurr] = calcCentroid(mat2)

				let xDeviation = cxCurr - cxPrev
				let yDeviation = cyCurr - cyPrev
				return [xDeviation, yDeviation]
			}
		}
		return [0, 0]
	}
	return [0, 0]
}

const drawCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, linewidth?: number, color?: string) => {
	ctx.strokeStyle = color ? color : '#6100cf'
	ctx.lineWidth = linewidth ? linewidth : 5
	ctx.beginPath()
	ctx.arc(x, y, r, 0, Math.PI * 2, true)
	ctx.stroke()
}

const drawCircle2 = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, linewidth?: number, color?: string) => {
	ctx.strokeStyle = color ? color : '#22ed07'
	ctx.lineWidth = linewidth ? linewidth : 5
	ctx.beginPath()
	ctx.arc(x, y, r, 0, Math.PI * 2, true)
	ctx.stroke()
}

const drawCube = (ctx: CanvasRenderingContext2D, x: number, y: number, wx: number, wy: number, h: number, color: string, strokeColor?: string, stroke?: boolean, fill?: boolean) => {
	ctx.lineJoin = "round";
	if (stroke === undefined) stroke = true
	if (fill === undefined) fill = true
	if (strokeColor === undefined) strokeColor = '#FFFFFF'

	// left face
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(x - wx, y - wx * 0.5);
	ctx.lineTo(x - wx, y - h - wx * 0.5);
	ctx.lineTo(x, y - h * 1);
	ctx.closePath();
	ctx.fillStyle = color;
	ctx.strokeStyle = strokeColor;
	if (stroke === true) ctx.stroke();
	if (fill === true) ctx.fill();

	// right face
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(x + wy, y - wy * 0.5);
	ctx.lineTo(x + wy, y - h - wy * 0.5);
	ctx.lineTo(x, y - h * 1);
	ctx.closePath();
	ctx.fillStyle = color;
	ctx.strokeStyle = strokeColor;
	if (stroke === true) ctx.stroke();
	if (fill === true) ctx.fill();
	
	// center face
	ctx.beginPath();
	ctx.moveTo(x, y - h);
	ctx.lineTo(x - wx, y - h - wx * 0.5);
	ctx.lineTo(x - wx + wy, y - h - (wx * 0.5 + wy * 0.5));
	ctx.lineTo(x + wy, y - h - wy * 0.5);
	ctx.closePath();
	ctx.fillStyle = color;
	ctx.strokeStyle = strokeColor;
	if (stroke === true) ctx.stroke();
	if (fill === true) ctx.fill();
}

const detectGrabbingCube = (ctx: CanvasRenderingContext2D, handLandmarks: NormalizedLandmarkListList) => {
	if (handLandmarks.length === 1 && handLandmarks[0] !== undefined) {
		if (handLandmarks.length === 1 && handLandmarks[0].length > 8) {
			const width = ctx.canvas.width
			const height = ctx.canvas.height
			const [x1, y1] = [handLandmarks[0][8].x * width, handLandmarks[0][8].y * height]
			const [x2, y2] = [handLandmarks[0][4].x * width, handLandmarks[0][4].y * height]
			const dist1 = Math.abs(calcDistance(x1, y1, cubeTracker.cx, cubeTracker.cy))
			const dist2 = Math.abs(calcDistance(x2, y2, cubeTracker.cx, cubeTracker.cy))
			// console.log(dist1, dist2, cubeTracker.r1, cubeTracker.r2, cubeTracker.cx, cubeTracker.cy)
			if (dist1 < cubeTracker.r1 && dist2 < cubeTracker.r1 && dist1 > cubeTracker.r2 && dist2 > cubeTracker.r2) {
				return true
			} else return false
		}
	}
	return false
}

/**
 * @param ctx canvas context
 * @param results mediapipe model results
 */
export const drawCanvas = (ctx: CanvasRenderingContext2D, results: Results) => {
	rsm.setResultsArr(results.multiHandLandmarks)
	rsm.setResultsWorldArr(results.multiHandWorldLandmarks)
	// console.log(rsm.resultsArr)

	const width = ctx.canvas.width
	const height = ctx.canvas.height

	ctx.save()
	ctx.clearRect(0, 0, width, height)
	ctx.scale(-1, 1)
	ctx.translate(-width, 0)
	// display image
	ctx.drawImage(results.image, 0, 0, width, height)
	// show hand landmarks
	if (results.multiHandLandmarks) {
		// show connectors and landmarks
		for (const landmarks of results.multiHandLandmarks) {
			drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#008f9e', lineWidth: 5 })
			drawLandmarks(ctx, landmarks, { color: '#0cf5a3', lineWidth: 1, radius: 5 })
		}
		// display circle based on landmarks
		const isGrabbing = detectGrabbingCube(ctx, results.multiHandLandmarks)
		// console.log(isGrabbing)		
		if (isGrabbing === true) {
			let [xDev, yDev] = calcTranslation(width, height)
			cubeTracker.translate(xDev, yDev);
			drawCircle2(ctx, cubeTracker.cx, cubeTracker.cy, cubeTracker.r1)
		}
		else {
			drawCircle(ctx, cubeTracker.cx, cubeTracker.cy, cubeTracker.r1)
		}
		drawCube(ctx, cubeTracker.x, cubeTracker.y, cubeTracker.wx, cubeTracker.wy, cubeTracker.h, cubeTracker.color)
		// drawCircle(ctx, cubeTracker.cx, cubeTracker.cy, cubeTracker.r1)
	}
	ctx.restore()
}
