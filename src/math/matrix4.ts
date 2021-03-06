import { Vector3 } from "./vector3";
import { Quaternion } from "./quaternion";

/**
 * Interface for serialising and deserialising Matrix4 structure
 * for storage/database purposes
 */
export interface Matrix4Json {
	// first
	readonly m00: number;
	readonly m10: number;
	readonly m20: number;
	readonly m30: number;

	// second
	readonly m01: number;
	readonly m11: number;
	readonly m21: number;
	readonly m31: number;

	// third
	readonly m02: number;
	readonly m12: number;
	readonly m22: number;
	readonly m32: number;

	// fourth
	readonly m03: number;
	readonly m13: number;
	readonly m23: number;
	readonly m33: number;
}

/**
 * 16 value column-major 4x4 Matrix
 */
export class Matrix4 {
	// this is a 16 value array that stores the 4x4 matrix
	private readonly _val: number[];

	/**
	 * Initialise a new Matrix as the default Identity Matrix
	 */
	constructor() {
		// init to identity matrix
		this._val = [
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		];
	}

	/**
	 * Serialise this Matrix for storage/database purposes
	 * See JsonMatrix4 Interface for details
	 */
	public serialise(): Matrix4Json {
		const m: number[] = this._val;

		return {
			// first
			m00: m[0],
			m10: m[1],
			m20: m[2],
			m30: m[3],
			// second
			m01: m[4],
			m11: m[5],
			m21: m[6],
			m31: m[7],
			// third
			m02: m[8],
			m12: m[9],
			m22: m[10],
			m32: m[11],
			// fourth
			m03: m[12],
			m13: m[13],
			m23: m[14],
			m33: m[15],
		};
	}

	/**
	 * Deserialise a previously serialised version of a Matrix
	 * 
	 * @param values The serialised Matrix to deserialise
	 */
	public static deserialise(values: Matrix4Json): Matrix4 {
		return new Matrix4().deserialise(values);
	}

	/**
	 * Deserialise a previously serialised version of a Matrix
	 *
	 * @param values The serialised Matrix to deserialise
	 */
	public deserialise(values: Matrix4Json): Matrix4 {
		return this.set(
			values.m00, values.m01, values.m02, values.m03,
			values.m10, values.m11, values.m12, values.m13,
			values.m20, values.m21, values.m22, values.m23,
			values.m30, values.m31, values.m32, values.m33
		);
	}

	/**
	 * Sets this matrix to a projection matrix useful for controlling a Projection Camera
	 * 
	 * @param near The near plane of the projection
	 * @param far The far plane of the projection
	 * @param fov The field of view
	 * @param aspect The aspect ratio, typically width/height of the window
	 */
	public setToProjection(near: number, far: number, fov: number, aspect: number): Matrix4 {
		const fd: number = 1.0 / Math.tan((fov * (Math.PI / 180.0)) / 2.0);
		const a1: number = (far + near) / (near - far);
		const a2: number = (2.0 * far * near) / (near - far);

		const m: number[] = this._val;

		m[0] = fd / aspect;
		m[1] = 0;
		m[2] = 0;
		m[3] = 0;
		m[4] = 0;
		m[5] = fd;
		m[6] = 0;
		m[7] = 0;
		m[8] = 0;
		m[9] = 0;
		m[10] = a1;
		m[11] = -1;
		m[12] = 0;
		m[13] = 0;
		m[14] = a2;
		m[15] = 0;

		return this;
	}

	/**
	 * Compose a 4x4 Position Matrix from a given position
	 * 
	 * @param position The position (Vector3)
	 */
	public composePos(position: Vector3): Matrix4 {
		const m: number[] = this._val;

		m[0] = 1;
		m[4] = 0;
		m[8] = 0;
		m[12] = position.x;

		m[1] = 0;
		m[5] = 1;
		m[9] = 0;
		m[13] = position.y;

		m[2] = 0;
		m[6] = 0;
		m[10] = 1;
		m[14] = position.z;

		m[3] = 0;
		m[7] = 0;
		m[11] = 0;
		m[15] = 1;

		return this;
	}

	/**
	 * Compose a 4x4 Rotation Matrix from a given rotation
	 * 
	 * @param rotation The rotation (Quaternion)
	 */
	public composeRot(rotation: Quaternion): Matrix4 {
		return this.composePosRot(Vector3.ZERO, rotation);
	}

	/**
	 * Compose PR (Position, Rotation) 4x4 Matrix given a position and rotation factors
	 * 
	 * @param position The position (Vector3)
	 * @param rotation The rotation (Quaternion)
	 */
	public composePosRot(position: Vector3, rotation: Quaternion): Matrix4 {
		const xs: number = rotation.x * 2.0, ys = rotation.y * 2.0, zs = rotation.z * 2.0;
		const wx: number = rotation.w * xs, wy = rotation.w * ys, wz = rotation.w * zs;
		const xx: number = rotation.x * xs, xy = rotation.x * ys, xz = rotation.x * zs;
		const yy: number = rotation.y * ys, yz = rotation.y * zs, zz = rotation.z * zs;

		const m: number[] = this._val;

		m[0] = 1.0 - (yy + zz);
		m[4] = xy - wz;
		m[8] = xz + wy;
		m[12] = position.x;

		m[1] = xy + wz;
		m[5] = 1.0 - (xx + zz);
		m[9] = yz - wx;
		m[13] = position.y;

		m[2] = xz - wy;
		m[6] = yz + wx;
		m[10] = 1.0 - (xx + yy);
		m[14] = position.z;

		m[3] = 0;
		m[7] = 0;
		m[11] = 0;
		m[15] = 1;

		return this;
	}

	/**
	 * Composes PRS (Position, Rotation, Scale) 4x4 Matrix given a position, rotation and scale factors
	 * 
	 * @param position The position (Vector3)
	 * @param rotation The rotation (Quaternion)
	 * @param scale The scale (Vector3)
	 */
	public composePosRotSca(position: Vector3, rotation: Quaternion, scale: Vector3): Matrix4 {
		const xs: number = rotation.x * 2.0, ys = rotation.y * 2.0, zs = rotation.z * 2.0;
		const wx: number = rotation.w * xs, wy = rotation.w * ys, wz = rotation.w * zs;
		const xx: number = rotation.x * xs, xy = rotation.x * ys, xz = rotation.x * zs;
		const yy: number = rotation.y * ys, yz = rotation.y * zs, zz = rotation.z * zs;

		const m: number[] = this._val;

		m[0] = scale.x * (1.0 - (yy + zz));
		m[4] = scale.y * (xy - wz);
		m[8] = scale.z * (xz + wy);
		m[12] = position.x;

		m[1] = scale.x * (xy + wz);
		m[5] = scale.y * (1.0 - (xx + zz));
		m[9] = scale.z * (yz - wx);
		m[13] = position.y;

		m[2] = scale.x * (xz - wy);
		m[6] = scale.y * (yz + wx);
		m[10] = scale.z * (1.0 - (xx + yy));
		m[14] = position.z;

		m[3] = 0;
		m[7] = 0;
		m[11] = 0;
		m[15] = 1;

		return this;
	}

	/**
	 * Decomposes PRS (Position, Rotation, Scale) 4x4 Matrix into the provided
	 * Position, Rotation and Scale factors
	 * 
	 * @param position The position (Vector3)
	 * @param rotation The rotation (Quaternion)
	 * @param scale The scale (Vector3)
	 */
	public decomposePosRotSca(position: Vector3, rotation: Quaternion, scale: Vector3): void {
		const val: number[] = this._val;

		// SET ROTATION COMPONENT
		const xx: number = val[0];
		const xy: number = val[1];
		const xz: number = val[2];
		const yx: number = val[4];
		const yy: number = val[5];
		const yz: number = val[6];
		const zx: number = val[8];
		const zy: number = val[9];
		const zz: number = val[10];

		const sx = Vector3.len(xx, xy, xz);
		const sy = Vector3.len(yx, yy, yz);
		const sz = Vector3.len(zx, zy, zz);

		// normalise due to scale component
		const lx: number = 1.0 / sx;
		const ly: number = 1.0 / sy;
		const lz: number = 1.0 / sz;

		// scaled components
		const sxx: number = xx * lx;
		const sxy: number = xy * lx;
		const sxz: number = xz * lx;
		const syx: number = yx * ly;
		const syy: number = yy * ly;
		const syz: number = yz * ly;
		const szx: number = zx * lz;
		const szy: number = zy * lz;
		const szz: number = zz * lz;

		const t: number = sxx + syy + szz;

		if (t >= 0) {
			const s: number = Math.sqrt(t + 1);
			const w: number = 0.5 * s;
			const sd: number = 0.5 / s;
			const x: number = (szy - syz) * sd;
			const y: number = (sxz - szx) * sd;
			const z: number = (syx - sxy) * sd;

			rotation.set(x, y, z, w);
		}
		else if ((sxx > syy) && (sxx > szz)) {
			const s: number = Math.sqrt(1.0 + sxx - syy - szz);
			const x: number = s * 0.5;
			const sd: number = 0.5 / s;
			const y: number = (syx + sxy) * sd;
			const z: number = (sxz + szx) * sd;
			const w: number = (szy - syz) * sd;

			rotation.set(x, y, z, w);
		}
		else if (syy > szz) {
			const s: number = Math.sqrt(1.0 + syy - sxx - szz);
			const y: number = s * 0.5;
			const sd: number = 0.5 / s;
			const x: number = (syx + sxy) * sd;
			const z: number = (szy + syz) * sd;
			const w: number = (sxz - szx) * sd;

			rotation.set(x, y, z, w);
		}
		else {
			const s: number = Math.sqrt(1.0 + szz - sxx - syy);
			const z: number = s * 0.5;
			const sd: number = 0.5 / s;
			const x: number = (sxz + szx) * sd;
			const y: number = (szy + syz) * sd;
			const w: number = (syx - sxy) * sd;

			rotation.set(x, y, z, w);
		}

		scale.set(sx, sy, sz);
		position.set(val[12], val[13], val[14]);
	}

	/**
	 * Scales this matrix with the provided scale factor.
	 * 
	 * Optionally stores result in result Matrix. If a result matrix is not provided, 
	 * this matrix will be modified
	 * 
	 * @param scale The scale factor
	 * @param optresult (optional) The result to store in
	 */
	public scale(scale: number, optresult: Matrix4 | undefined = undefined): Matrix4 {
		const result: Matrix4 = optresult || this;

		const m: number[] = result._val;

		// first
		m[0] = m[0] * scale;
		m[1] = m[1] * scale;
		m[2] = m[2] * scale;
		m[3] = m[3] * scale;

		// second
		m[4] = m[4] * scale;
		m[5] = m[5] * scale;
		m[6] = m[6] * scale;
		m[7] = m[7] * scale;

		// third
		m[8] = m[8] * scale;
		m[9] = m[9] * scale;
		m[10] = m[10] * scale;
		m[11] = m[11] * scale;

		// fourth
		m[12] = m[12] * scale;
		m[13] = m[13] * scale;
		m[14] = m[14] * scale;
		m[15] = m[15] * scale;

		return result;
	}

	/**
	 * Multiplies this matrix with the provided matrix and optionally stores result
	 * in result Matrix. If a result matrix is not provided, this matrix will be modified
	 * 
	 * @param matrix The matrix to multiply this Matrix with
	 * @param result (optional) The result to store in
	 */
	public multiply(matrix: Matrix4, optresult: Matrix4 | undefined = undefined): Matrix4 {
		const result: Matrix4 = optresult || this;

		return Matrix4.multiply(this, matrix, result);
	}

	/**
	 * Pre-Multiplies this matrix with the provided matrix and optionally stores result
	 * in result Matrix. If a result matrix is not provided, this matrix will be modified
	 * 
	 * @param matrix The matrix to pre-multiply this Matrix with
	 * @param optresult (optional) The result to store in
	 */
	public preMultiply(matrix: Matrix4, optresult: Matrix4 | undefined = undefined): Matrix4 {
		const result: Matrix4 = optresult || this;

		return Matrix4.multiply(matrix, this, result);
	}

	/**
	 * Multiple a * b and store the result in result
	 * 
	 * @param a The first Matrix
	 * @param b The second Matrix
	 * @param result The container to store results
	 */
	public static multiply(a: Matrix4, b: Matrix4, result: Matrix4): Matrix4 {
		// NOTE: This could at some point move into a WASM module if SIMD becomes available
		const av: number[] = a._val;
		const bv: number[] = b._val;
		const r: number[] = result._val;

		const a11: number = av[0], a12 = av[4], a13 = av[8], a14 = av[12];
		const a21: number = av[1], a22 = av[5], a23 = av[9], a24 = av[13];
		const a31: number = av[2], a32 = av[6], a33 = av[10], a34 = av[14];
		const a41: number = av[3], a42 = av[7], a43 = av[11], a44 = av[15];

		const b11: number = bv[0], b12 = bv[4], b13 = bv[8], b14 = bv[12];
		const b21: number = bv[1], b22 = bv[5], b23 = bv[9], b24 = bv[13];
		const b31: number = bv[2], b32 = bv[6], b33 = bv[10], b34 = bv[14];
		const b41: number = bv[3], b42 = bv[7], b43 = bv[11], b44 = bv[15];

		r[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
		r[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
		r[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
		r[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

		r[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
		r[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
		r[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
		r[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

		r[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
		r[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
		r[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
		r[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

		r[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
		r[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
		r[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
		r[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

		return result;
	}

	/**
	 * Sets the current matrix with the provided values
	 * 
	 * [m00, m10, m20, m30]
	 * [m01, m11, m21, m31]
	 * [m02, m12, m22, m32]
	 * [m03, m13, m23, m33]
	 */
	public set(
		m00: number, m01: number, m02: number, m03: number,
		m10: number, m11: number, m12: number, m13: number,
		m20: number, m21: number, m22: number, m23: number,
		m30: number, m31: number, m32: number, m33: number): Matrix4 {

		const m: number[] = this._val;

		// first
		m[0] = m00;
		m[1] = m10;
		m[2] = m20;
		m[3] = m30;

		// second
		m[4] = m01;
		m[5] = m11;
		m[6] = m21;
		m[7] = m31;

		// third
		m[8] = m02;
		m[9] = m12;
		m[10] = m22;
		m[11] = m32;

		// fourth
		m[12] = m03;
		m[13] = m13;
		m[14] = m23;
		m[15] = m33;

		return this;
	}

	/**
	 * Copies the components of the provided array into the provided Matrix
	 * 
	 * @param values The values to copy
	 */
	public fromArray(values: number[]): Matrix4 {
		if (values.length < 16) {
			throw new Error("Matrix4.fromArray(number[]) - provided argument length must be >= 16");
		}

		const m: number[] = this._val;

		// first
		m[0] = values[0];
		m[1] = values[1];
		m[2] = values[2];
		m[3] = values[3];

		// second
		m[4] = values[4];
		m[5] = values[5];
		m[6] = values[6];
		m[7] = values[7];

		// third
		m[8] = values[8];
		m[9] = values[9];
		m[10] = values[10];
		m[11] = values[11];

		// fourth
		m[12] = values[12];
		m[13] = values[13];
		m[14] = values[14];
		m[15] = values[15];

		return this;
	}

	/**
	 * Copies an existing Matrix into this Matrix
	 * 
	 * @param matrix The Matrix to copy
	 */
	public copy(matrix: Matrix4): Matrix4 {
		return this.fromArray(matrix._val);
	}

	/**
	 * Clones the current matrix and returns a new instance
	 */
	public clone(): Matrix4 {
		return new Matrix4().fromArray(this._val);
	}

	/**
	 * Converts this Matrix into the Identity Matrix
	 */
	public identity(): Matrix4 {
		this.set(
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		);

		return this;
	}

	/**
	 * Calculate and return the inverse of this Matrix and optionally stores result
	 * in result Matrix. If a result matrix is not provided, this matrix will be modified
	 * 
	 * @param optresult (optional) The result to store in
	 */
	public invert(optresult: Matrix4 | undefined = undefined): Matrix4 {
		const det: number = this.determinant;

		if (det === 0) {
			throw new Error("Matrix4.invert() - cannot invert Matrix as determinant is 0");
		}

		const result: Matrix4 = optresult || this;

		const m: number[] = this._val;
		const r: number[] = result._val;

		const m00: number = m[9] * m[14] * m[7] - m[13] * m[10] * m[7] + m[13] * m[6] * m[11] - m[5] * m[14] * m[11] - m[9] * m[6] * m[15] + m[5] * m[10] * m[15];
		const m01: number = m[12] * m[10] * m[7] - m[8] * m[14] * m[7] - m[12] * m[6] * m[11] + m[4] * m[14] * m[11] + m[8] * m[6] * m[15] - m[4] * m[10] * m[15];
		const m02: number = m[8] * m[13] * m[7] - m[12] * m[9] * m[7] + m[12] * m[5] * m[11] - m[4] * m[13] * m[11] - m[8] * m[5] * m[15] + m[4] * m[9] * m[15];
		const m03: number = m[12] * m[9] * m[6] - m[8] * m[13] * m[6] - m[12] * m[5] * m[10] + m[4] * m[13] * m[10] + m[8] * m[5] * m[14] - m[4] * m[9] * m[14];
		const m10: number = m[13] * m[10] * m[3] - m[9] * m[14] * m[3] - m[13] * m[2] * m[11] + m[1] * m[14] * m[11] + m[9] * m[2] * m[15] - m[1] * m[10] * m[15];
		const m11: number = m[8] * m[14] * m[3] - m[12] * m[10] * m[3] + m[12] * m[2] * m[11] - m[0] * m[14] * m[11] - m[8] * m[2] * m[15] + m[0] * m[10] * m[15];
		const m12: number = m[12] * m[9] * m[3] - m[8] * m[13] * m[3] - m[12] * m[1] * m[11] + m[0] * m[13] * m[11] + m[8] * m[1] * m[15] - m[0] * m[9] * m[15];
		const m13: number = m[8] * m[13] * m[2] - m[12] * m[9] * m[2] + m[12] * m[1] * m[10] - m[0] * m[13] * m[10] - m[8] * m[1] * m[14] + m[0] * m[9] * m[14];
		const m20: number = m[5] * m[14] * m[3] - m[13] * m[6] * m[3] + m[13] * m[2] * m[7] - m[1] * m[14] * m[7] - m[5] * m[2] * m[15] + m[1] * m[6] * m[15];
		const m21: number = m[12] * m[6] * m[3] - m[4] * m[14] * m[3] - m[12] * m[2] * m[7] + m[0] * m[14] * m[7] + m[4] * m[2] * m[15] - m[0] * m[6] * m[15];
		const m22: number = m[4] * m[13] * m[3] - m[12] * m[5] * m[3] + m[12] * m[1] * m[7] - m[0] * m[13] * m[7] - m[4] * m[1] * m[15] + m[0] * m[5] * m[15];
		const m23: number = m[12] * m[5] * m[2] - m[4] * m[13] * m[2] - m[12] * m[1] * m[6] + m[0] * m[13] * m[6] + m[4] * m[1] * m[14] - m[0] * m[5] * m[14];
		const m30: number = m[9] * m[6] * m[3] - m[5] * m[10] * m[3] - m[9] * m[2] * m[7] + m[1] * m[10] * m[7] + m[5] * m[2] * m[11] - m[1] * m[6] * m[11];
		const m31: number = m[4] * m[10] * m[3] - m[8] * m[6] * m[3] + m[8] * m[2] * m[7] - m[0] * m[10] * m[7] - m[4] * m[2] * m[11] + m[0] * m[6] * m[11];
		const m32: number = m[8] * m[5] * m[3] - m[4] * m[9] * m[3] - m[8] * m[1] * m[7] + m[0] * m[9] * m[7] + m[4] * m[1] * m[11] - m[0] * m[5] * m[11];
		const m33: number = m[4] * m[9] * m[2] - m[8] * m[5] * m[2] + m[8] * m[1] * m[6] - m[0] * m[9] * m[6] - m[4] * m[1] * m[10] + m[0] * m[5] * m[10];

		const idet: number = 1.0 / det;

		r[0] = m00 * idet;
		r[1] = m10 * idet;
		r[2] = m20 * idet;
		r[3] = m30 * idet;
		r[4] = m01 * idet;
		r[5] = m11 * idet;
		r[6] = m21 * idet;
		r[7] = m31 * idet;
		r[8] = m02 * idet;
		r[9] = m12 * idet;
		r[10] = m22 * idet;
		r[11] = m32 * idet;
		r[12] = m03 * idet;
		r[13] = m13 * idet;
		r[14] = m23 * idet;
		r[15] = m33 * idet;

		return this;
	}

	/**
	 * Calculate and return the transpose of this Matrix
	 */
	public transpose(): Matrix4 {
		const m: number[] = this._val;

		const m01: number = m[4];
		const m02: number = m[8];
		const m03: number = m[12];
		const m12: number = m[9];
		const m13: number = m[13];
		const m23: number = m[14];

		m[4] = m[1];
		m[8] = m[2];
		m[12] = m[3];
		m[1] = m01;
		m[9] = m[6];
		m[13] = m[7];
		m[2] = m02;
		m[6] = m12;
		m[14] = m[11];
		m[3] = m03;
		m[7] = m13;
		m[11] = m23;

		return this;
	}

	/**
	 * Resets the position component into 0,0,0
	 */
	public resetPos(): Matrix4 {
		const m: number[] = this._val;

		m[12] = 0.0;
		m[13] = 0.0;
		m[14] = 0.0;

		return this;
	}

	/**
	 * Calculate and return the determinant of this Matrix
	 */
	public get determinant(): number {
		const m: number[] = this._val;

		return m[3] * m[6] * m[9] * m[12] - m[2] * m[7] * m[9] * m[12] - m[3] * m[5]
			* m[10] * m[12] + m[1] * m[7] * m[10] * m[12] + m[2] * m[5] * m[11] * m[12] - m[1]
			* m[6] * m[11] * m[12] - m[3] * m[6] * m[8] * m[13] + m[2] * m[7] * m[8] * m[13]
			+ m[3] * m[4] * m[10] * m[13] - m[0] * m[7] * m[10] * m[13] - m[2] * m[4] * m[11]
			* m[13] + m[0] * m[6] * m[11] * m[13] + m[3] * m[5] * m[8] * m[14] - m[1] * m[7]
			* m[8] * m[14] - m[3] * m[4] * m[9] * m[14] + m[0] * m[7] * m[9] * m[14] + m[1]
			* m[4] * m[11] * m[14] - m[0] * m[5] * m[11] * m[14] - m[2] * m[5] * m[8] * m[15]
			+ m[1] * m[6] * m[8] * m[15] + m[2] * m[4] * m[9] * m[15] - m[0] * m[6] * m[9]
			* m[15] - m[1] * m[4] * m[10] * m[15] + m[0] * m[5] * m[10] * m[15];
	}

	/**
	 * Access the array reference for this matrix
	 */
	public get values(): number[] {
		return this._val;
	}
}