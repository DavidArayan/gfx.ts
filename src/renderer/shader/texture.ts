import { Renderer } from "../renderer";
import { Uniform } from "./uniform";
import { Identifiable } from "../identifiable";

export class Texture extends Identifiable {
    private readonly _image: HTMLImageElement;
    private readonly _url: string;
    private _texture?: WebGLTexture;
    private _crossOrigin: string;

    constructor(url: string) {
        super();
        this._image = new Image();
        this._url = url;
        this._texture = undefined;
        this._crossOrigin = "anonymous";
    }

    /**
     * Asynchronously loads a texture from the provided url
     * 
     * @param url - the url to load the texture from
     */
    public load(): Promise<Texture> {
        return new Promise<Texture>((accept, reject) => {
            const image: HTMLImageElement = this._image;

            image.onload = () => {
                Renderer.instance.yield.next.then((renderer) => {
                    this._executeOnce(renderer.context.gl);

                    accept(this);
                }).catch(reject);
            };

            image.onerror = () => {
                reject(new Error("Texture.load(string) - failed to load image at url " + this._url));
            };

            image.crossOrigin = this._crossOrigin;
            image.src = this._url;
        });
    }

    public get crossOrigin(): string {
        return this._crossOrigin;
    }

    public set crossOrigin(newOrigin: string) {
        this._crossOrigin = newOrigin;
    }

    /**
     * Called by the rendering engine once at the start of the frame. See
     * load() functionality for how this operation is queued.
     * 
     * @param gl - the gl context passed by the rendering engine
     */
    private _executeOnce(gl: WebGL2RenderingContext): void {
        const texture: WebGLTexture | null = gl.createTexture();

        if (texture === null) {
            throw new Error("Texture.executeOnce(gl) - failed gl.createTexture()");
        }

        gl.bindTexture(gl.TEXTURE_2D, texture);

        // upload texture to the GPU
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._image);

        // parameters
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        this._texture = texture;

        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * Bind and use this texture for drawing/rendering
     */
    public bind(gl: WebGL2RenderingContext, uniform: Uniform, unit: number = 0): void {
        if (this._texture === undefined) {
            return;
        }

        gl.uniform1i(uniform.location, unit);
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
    }

    /**
     * Destroy the GL image and free memory
     */
    public destroy(): void {
        const renderer: Renderer = Renderer.instance;

        if (!renderer.valid) {
            throw new Error("Texture.destroy() - unable to delete texture as Renderer instance is not valid");
        }

        const gl: WebGL2RenderingContext = renderer.context.gl;

        if (this._texture !== undefined) {
            gl.deleteTexture(this._texture);
        }

        this._texture = undefined;
    }
}