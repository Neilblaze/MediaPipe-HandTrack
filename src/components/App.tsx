import React, { useCallback, useEffect, useRef, VFC } from 'react';
import Webcam from 'react-webcam';
import { css } from '@emotion/css';
import { Camera } from '@mediapipe/camera_utils';
import { Hands, Results } from '@mediapipe/hands';
import { drawCanvas, resetCubeTracker } from '../utils/drawCanvas';

export const App: VFC = () => {
	const webcamRef = useRef<Webcam>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const resultsRef = useRef<Results>()

	/**
	 * @param results
	 */
	const onResults = useCallback((results: Results) => {
		resultsRef.current = results
		const canvasCtx = canvasRef.current!.getContext('2d')!
		drawCanvas(canvasCtx, results)
	}, [])

	useEffect(() => {
		const hands = new Hands({
			locateFile: file => {
				return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
			}
		})

		hands.setOptions({
			maxNumHands: 2,
			modelComplexity: 1,
			minDetectionConfidence: 0.5,
			minTrackingConfidence: 0.5
		})

		hands.onResults(onResults)

		if (typeof webcamRef.current !== 'undefined' && webcamRef.current !== null) {
			const camera = new Camera(webcamRef.current.video!, {
				onFrame: async () => {
					await hands.send({ image: webcamRef.current!.video! })
				},
				width: 1280,
				height: 720
			})
			camera.start()
		}
	}, [onResults])

	const ResetTask = () => {
		resetCubeTracker()
	}

	return (
		<div className={styles.container}>
			<Webcam
				audio={false}
				style={{ visibility: 'hidden' }}
				width={1280}
				height={720}
				ref={webcamRef}
				screenshotFormat="image/jpeg"
				videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
			/>
			<canvas ref={canvasRef} className={styles.canvas} width={1280} height={720} />
			<div className={styles.buttonContainer}>
					<img className={styles.resetButton} src="./public/../reset.png" onClick={ResetTask} alt="RESET"/>
			</div>
		</div>
	)
}

const styles = {
	container: css`
		position: relative;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		display: flex;
		justify-content: center;
		align-items: center;
	`,
	canvas: css`
		position: absolute;
		width: 1280px;
		height: 720px;
		background-color: #fff;
		border-radius: 23px;
		border: 1px solid #0082cf;
	`,
	buttonContainer: css`
		position: absolute;
		top: 17px;
		left: 128px;
	`,
	resetButton: css`
		height: 50px;
		width: 50px;
		border-radius: 50%;
		border: 0.3px solid #0082cf;
	`
}
