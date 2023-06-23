/// <reference types="gl-matrix" />

declare module "@novorender/webgl-api" {
    type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];

    import type { ReadonlyVec3, ReadonlyVec4, ReadonlyQuat, ReadonlyMat3, ReadonlyMat4 } from "gl-matrix";

    /** Polyfill for missing/removed API interface.
     * @remarks See https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas/convertToBlob for more details.
     */
    export interface ImageEncodeOptions_ {
        readonly type: string;
        readonly quality: number;
    }

    /** Color expressed as a 3D vector with ranges [0.0 - 1.0] for red, green and blue components respectively. */
    export type ColorRGB = ReadonlyVec3;

    /** Color expressed as a 4D vector with ranges [0.0 - 1.0] for red, green, blue and alpha components respectively. */
    export type ColorRGBA = ReadonlyVec4;

    /** Integer index/handle for identifying a single object */
    export type ObjectId = number; // integer

    /** Read only array of integer indices/handles for identifying a set of objects */
    export type ObjectIdArray = ReadonlyArray<ObjectId>; // go for Uin32Array instead?

    /** Fixed size, read-only array type. */
    export type FixedSizeArray<N extends number, T> = N extends 0
        ? never[]
        : {
            0: T;
            length: N;
        } & ReadonlyArray<T>;

    /** Axis-aligned bounding box */
    export interface AABB {
        /** minimum coordinates */
        readonly min: ReadonlyVec3;
        /** maximum coordinates */
        readonly max: ReadonlyVec3;
    }

    /** Bounding sphere */
    export interface BoundingSphere {
        /** Sphere center. */
        readonly center: ReadonlyVec3;
        /** Sphere radius. */
        readonly radius: number;
    }

    /** Geographic coordinate expressed by angles */
    export interface GeoLocation {
        /** Angle ranging from 0° at the Prime Meridian to +180° eastward and −180° westward. */
        longitude: number;
        /** Angle ranging from 0° at the Equator to +90° (North pole) and -90° (South pole). */
        latitude: number;
    }

    /** Visual highlighting for groups of objects.
     * @remarks
     * This interface is used to highlight or hide sets of objects, based e.g. on interactive selections or queries.
     * Each 3D object in the scene has a unique id/index, which can be assigned to one of the available highlight groups.
     * By default, all objects are assigned to group #0.
     * To change a highlight for a specific object or set of objects, simply change the {@link objectGroups} index for that/this object id(s):
     * `objectHighlights[objectId] = newHighlightGroupIndex`.
     *
     * Highlight index 255/0xff is reserved and used to hide objects.
     * Although you can also hide objects by making them 100% transparent (opacity = 0), assigning them to index 255 is more performant.
     *
     * Changes to object highlights does not become visible until you call the {@link commit} method.
     */
    export interface ObjectHighlighter {
        /** Indexed collection of groups. */
        readonly objectHighlightIndices: Uint8Array; // TODO: Use a generic indexer interface instead?

        /** Commit changes for rendering. */
        commit(): Promise<void>;
    }

    /** Linear transform options.
     * @remarks
     * The transform is performed by first applying scale, then adding offset, i.e.: result = value * scale + offset.
     * If scale = 0, offset will effectively replace input value.
     */
    export interface LinearTransform {
        /** Multiplicand for input value. Default = 1.*/
        readonly scale?: number;
        /** Addend for scaled input value. Default = 0. */
        readonly offset?: number;
    }

    /** Options for RGBA + alpha color transformation.
     * @remarks
     * All input values are between 0 and 1.
     */
    export interface RGBAOptions {
        /** Red color adjustment. */
        readonly red: number | LinearTransform;
        /** Green color adjustment. */
        readonly green: number | LinearTransform;
        /** Blue color adjustment. */
        readonly blue: number | LinearTransform;
        /** Opacity/alpha adjustment. */
        readonly opacity: number | LinearTransform;
    }

    /** Options for HSL + alpha color transformation.
     * @remarks
     * All input values are between 0 and 1.
     * See [Wikipedia](https://en.wikipedia.org/wiki/HSL_and_HSV) for more details on the HSV color space.
     */
    export interface HSLAOptions {
        /** Lightness adjustment. */
        readonly lightness: number | LinearTransform;
        /** Saturation adjustment (scale). */
        readonly saturation: number;
        // /** Hue adjustment (offset). */
        // readonly hue: number;
        /** Opacity/alpha adjustment. */
        readonly opacity: number | LinearTransform;
    }

    /** Visual highlighting for a group of objects.
     * @remarks
     * Highlighting is done using a linear transformation matrix per group, which allows for various visual effects in addition to simply assigning a single color.
     * This can be useful to preserve at least some aspects of the original material colors, by, e.g. making certain objects semi-transparent, darker/brighter or color/grayscale.
     */
    export interface Highlight {
        /** 5x4 row-major matrix for color/opacity transform.
         * @remarks
         * This matrix defines the linear transformation that is applied to the original RGBA color before rendering.
         * The fifth column is multiplied by a constant 1, making it useful for translation.
         * The resulting colors are computed thus:
         * ```
         * output_red = r*m[0] + g*m[1] + b*m[2] + a*m[3] + m[4]
         * output_green = r*m[5] + g*m[6] + b*m[7] + a*m[8] + m[9]
         * output_blue = r*m[10] + g*m[11] + b*m[12] + a*m[13] + m[14]
         * output_alpha = r*m[15] + g*m[16] + b*m[17] + a*m[18] + m[19]
         * ```
         * All input values are between 0 and 1 and output value will be clamped to this range.
         * Setting this matrix directly offers the most amount of flexibility.
         */
        rgbaTransform: FixedSizeArray<20, number>;
    }

    /** Asset data used for dynamic objects.
     * @remarks
     * Dynamic assets represents some combination of 3D geometry, textures, animations, sound and physics data.
     * They can then be introduced into a scene as dynamic objects, allowing multiple instances of each assets.
     * Assets can be imported from an existing file, such as a gltf model.
     */
    export interface DynamicAsset {
        /** The url used for loading data, if any. */
        readonly url?: URL;

        /** The id assigned to this asset. */
        readonly id: number;

        /** The bounding sphere of the loaded asset. */
        readonly boundingSphere: BoundingSphere;

        /** Dispose of asset data.
         * @remarks
         * Disposing of asset data will free up associated system memory.
         * Doing so will make it impossible to create new dynamic objects from this asset.
         * Already created dynamic objects will remain, however, since they are essentially GPU memory copies.
         */
        dispose(): void;

        // TODO: create assets from scene subset snapshots for e.g. offline rendering.
        // TODO: create/edit programatically for e.g. UI elements.
        // TODO: add export to gltf/whatnot.
    }

    /** 3D object that can be animated and moved.
     * @remarks
     * Unlike the static geometry of a scene, dynamic objects can be added/removed and moved around after a scene has been created.
     * This functionality comes at a cost, however.
     * Dynamic objects must be fully loaded into client memory before they can be rendered, which restricts their practial use to relatively trivial geometry only.
     * Nor can they take advantage of globally pre-baked information, such as indirect light.
     * They also lack several features of static scene geometry, such as object picking and clipping volumes etc.
     * Dynamic objects can be helpful for 3D UI widgets, background animations of e.g. moving people, cars or animals etc.
     */
    export interface DynamicObject {
        /** The scene from this this object was created. */
        readonly scene: Scene;
        /** The geometry used for rendering. */
        readonly geometry: DynamicAsset;
        /** Whether to render object or not. */
        visible: boolean;
        /** The 3D position of object in world space coordinates. */
        position: ReadonlyVec3;
        /** The 3D orientation of object in world space expressed as a quaternion. */
        rotation: ReadonlyQuat;
        /** The scale of object in local coordinates. */
        scale: ReadonlyVec3;
        /** Remove object from scene and free up any associated resources. */
        dispose(): void;
        // TODO: add animation timer and run/pause mechanism
    }

    /** Lightweight reference to a single object within a scene instance.
     * @remarks
     * Object metadata are not loaded with scene automatically and may require an additional server request. This interface contains only the identity required to perform such a request.
     */
    export interface ObjectReference {
        /** The id of the object */
        readonly id: ObjectId;

        /** The instance that contains this object. */
        // readonly instance: Instance;

        /** Load the associated object meta data. */
        loadMetaData(): Promise<ObjectData>;
    }

    /** Type of node */
    export const enum NodeType {
        /** Node has children. */
        Internal = 0,
        /** Node has no children. */
        Leaf = 1,
    }

    /** Hierarcical object reference to a single object within a scene instance.
     *
     * @remarks
     * This interface extends {@link ObjectReference} with data required for hierachical tree views and 3D rendering without loading the entire set of metadata.
     */
    export interface HierarcicalObjectReference extends ObjectReference {
        /** The path of the object expressed as a hierarchical filesystem-like path string. */
        readonly path: string;

        /** Type of node. */
        readonly type: NodeType;

        /** Bounding volume */
        readonly bounds?: {
            // readonly box: AABB;
            readonly sphere: BoundingSphere;
        };
        readonly descendants?: ObjectId[];
    }

    /** Object metadata.
     */
    export interface ObjectData extends HierarcicalObjectReference {
        /** Name of object (typically a GUID from IFC database). */
        readonly name: string;

        /** Description of object (typically from IFC database). */
        readonly description?: string;

        /** Url associated with object */
        readonly url?: string;

        /** String dictionary of any additional metadata properties associated with object */
        properties: [key: string, value: string][];

        /** Save object meta data. */
        save(): Promise<boolean>;
    }

    interface CameraProperties {
        /** Camera type. */
        readonly kind: "pinhole" | "orthographic";
        /** Camera position expressed as a world space 3D vector. */
        readonly position: ReadonlyVec3;
        /** Camera orientation expressed as a world space 3D quaternion. */
        readonly rotation: ReadonlyQuat;
        /** Field of view expressed as the vertical viewing angle in degrees for pinhole cameras, or vertical aperature dimension in meters for orthographic cameras. */
        fieldOfView: number;
        /** Distance to the view frustum near clipping plane.
         * @remarks
         *  The value must be larger than 0 and preferably as large as possible without creating undesired clipping effects near the camera.
         *  Camera controllers will automatically adjust this value whenever a new scene is assigned to their view, so setting it manually is generally not required.
         *  See {@link https://en.wikipedia.org/wiki/Viewing_frustum} for more details.
         */
        near: number;
        /** Distance to the view frustum far clipping plane.
         * @remarks
         *  The value must be larger than {@link near} and and large enough to include the desired maximum viewing distance, which typically is some multiple of the scene size.
         *  Camera controllers will automatically adjust this value whenever a new scene is assigned to their view, so setting it manually is generally not required.
         *  See {@link https://en.wikipedia.org/wiki/Viewing_frustum} for more details.
         */
        far: number;
    }

    /** Camera Object. */
    interface Camera extends CameraProperties {
        /** The view to which this camera belongs. */
        readonly view: View;
        /** Get or set the motion controller assigned to this camera. By default, this will be a static controller, whose only function is to provide a reasonable default view for a given scene. */
        controller: CameraController;
        /** Compute the distance of point from camera view plane. */
        getDistanceFromViewPlane(point: ReadonlyVec3): number;
    }

    /** Search pattern */
    export interface SearchPattern {
        /** Property name to find. */
        property?: string;
        /** Value to find.  
         * if value is array of strings then search property value should match any ("or" function) of array values
         */
        value?: string | string[];
        /** Require exact match or not. */
        exact?: boolean;
        /** Exclude this match from result.
         * property name is mandatory
         */
        exclude?: boolean;
        /** Range of values to search.
         * property name is mandatory
         */
        range?: { min: string; max: string; };

        /** Volume to include in search.
         * @remarks
         * We currently only use object axis alinged bounding boxes (AABB) for this search.
         * Each plane defines a half-space, where the positive side of the plane is included in the search.
         * If {@link exact} is true, the whole object AABB must be on the positive side.
         * Else it must be at least partially on the positive side.
         * If {@link exclude} is true, all objects that would have been excluded will now be included, and vice versa.
         */
        planes?: readonly ReadonlyVec4[];
    }

    /** Search object options */
    export interface SearchOptions {
        /** Path to search start from.
         * @remarks
         * Path is similar to filesystem file/folder hierarchical paths, e.g. my_folder/my_object.
         * Paths reflect original CAD model hierarchy (.ifc, .rvm, etc).
         * Only objects contained within specified folder will be returned.
         */
        parentPath?: string;

        /** How many generations of descendants to include in search.
         * @remarks
         * 0 - object itself
         *
         * 1 - children only
         *
         * undefined - deepest levels.
         */
        descentDepth?: number;

        /** Property pattern to search for. */
        searchPattern?: SearchPattern[] | string;

        /** Preload all matching objects.
         * @remarks
         * This param should be set if you want to access some parameters of all results later to prevent per object data request.
         */
        full?: boolean;
    }

    /** Scene document
     *
     * @remarks
     * A scene represents the document entity of NovoRender, corresponding to something akin to a top level CAD assembly.
     * It provides information for both rendering 3D geometry and querying for object metadata.
     * In order to fascilitate complex datasets on small client devices, scenes load most data on demand and caches a relevant, but still potentially substantial subset in system and GPU memory.
     * Weaker devices may struggle to host multiple scenes in memory at once, so make sure to remove any references to unused scenes and related objects for effective garbage collection when loading new scenes.
     */
    export interface Scene {
        /** Scene Id
         * @remarks
         * For new scenes, this will contain a random string/guid.
         */
        id: string;

        /** Scene title */
        title: string;

        /** Scene subtrees types
         * @remark
         * Available types
         */
        readonly subtrees?: ("terrain" | "triangles" | "lines" | "points" | "documents")[];

        readonly variants?: ("deviation" | "intensity")[];

        /** Date of scene creation */
        readonly dateCreated: Date;

        /** Date of when scene was last saved */
        readonly dateLastSaved: Date;

        /** Scene description. */
        description?: string;

        /** Geological location of scene.
         * @remarks
         * This location is used for calculating correct lighting/sun position for a given time and date. In future, it may also be used for google earth-like background settings and map icons etc. For static structures in particular, providing an accurate location is thus recommended.
         */
        location?: GeoLocation;

        /** Local timezone expressed in hours from GMT.
         * @remarks
         * Information for calculating correct lighting/sun position using local time rather than UTC.
         *
         */
        timezone?: number;

        /** The bounding sphere of the scene in world space.
         * @remarks
         * This property is useful for e.g. initial camera positioning based on approximate scene size and center.
         */
        readonly boundingSphere: BoundingSphere;

        /** Return a queryable object reference.
         * @param id Object Id
         */
        getObjectReference(id: ObjectId): ObjectReference;

        /** Search for objects.
         * @param filter {@link SearchOptions} filtering options.
         * @param signal Abort request signal.
         * @remarks
         * Scenes contains objects with associated properties.
         * Loading scenes with millions of objects direcly into memory may be slow or even impossible on memory constrained devices.
         * This function lets you selectively load object properties based on some criteria.
         * An example of this is if you want to make a virtual tree view that only load child nodes on demand when the user expands a folder to make your UI scale to very large scenes.
         * ```typescript
         * const children = scene.search({ parentPath: "rootfolder/subfolder", descentDepth: 1});
         * for await (const child of children) {
         * // TODO: append child's properties to UI
         * }
         * ```
         * @returns Async iterator of {@link HierarcicalObjectReference}
         */
        search(filter: SearchOptions, signal?: AbortSignal): AsyncIterableIterator<HierarcicalObjectReference>;

        /** Returns all descendants */
        descendants(object: HierarcicalObjectReference, signal: AbortSignal | undefined): Promise<ObjectId[]>;

        /** Compute sun position.
         * @param time Desired date and time of day in universal time (UTC).
         * @remarks
         * The computation will take into account seasonal changes as well as time.
         * The {@link timezone} may be useful to provide the correct UTC time in the physical area described by the scene but is not used by this method directly.
         * @returns The sun position, which can then be used in the render settings to visualize the light conditions for a given site on the given time.
         */
        computeSunPosition(time: Date): { azimuth: number; inclination: number; };

        /** List of dynamic objects currently in scene.
         * @remarks
         * To add a new dynamic object, see {@link createDynamicObject}.
         * To remove a dynamic object, see {@link DynamicObject.dispose}.
         */
        readonly dynamicObjects: IterableIterator<DynamicObject>;

        /** Create a new dynamic object.
         * @param asset The geometry asset to use for this object.
         * @returns A new dynamic object, whose state is initially invisible by default.
         */
        createDynamicObject(asset: DynamicAsset): DynamicObject;

        /** An object that allows sets of objects to be highlighted using different color transforms. */
        readonly objectHighlighter: ObjectHighlighter;
    }

    /** Camera motion controller.
     * @remarks
     * A motion controller fascilitates navigating a camera in space from user input.
     */
    export interface CameraController {
        /** Defines mouse buttons actions.
         * @param mouseButtonsMap Bitmask definition what buttons will rotate, pan and orbit camera.
         * @remarks
         * Bit mask of buttons:
         * 1 - left button.
         * 2 - right button.
         * 4 - middle button.
         * Default value: { rotate: 1, pan: 4, orbit: 2, pivot: 2 }
         * rotate, pan and orbit are movement while button hold
         * pivot is setting of pivot point for orbit rotation on button down
         * You could disable some action by do not set it or set to 0, like { rotate: 1, pan: 2 } or { rotate: 1, pan: 2, orbit: 0}
         * Here could be combination of buttons, for example if you want use right button for rotation and left or middle button for panning and no orbit then value should be { rotate: 2, pan: 5 }
         */
        mouseButtonsMap: { rotate: number; pan: number; orbit: number; pivot: number; };

        /** Defines touch fingers actions.
         * @param fingersMap defines how many fingers will rotate, pan and orbit camera.
         * @remarks
         * Default value: { rotate: 1, pan: 3, orbit: 3, pivot: 3 }
         * rotate, pan and orbit are movement while holding fingers
         * pivot is setting of pivot point for orbit rotation
         * You could disable some action by do not set it or set to 0, like { rotate: 1, pan: 2 } or { rotate: 1, pan: 2, orbit: 0}
         */
        fingersMap: { rotate: number; pan: number; orbit: number; pivot: number; };

        /** Reset camera position and rotation to scene default. */
        reset(): void;

        /** Zoom to area of interest.
         * @param bounds The bounding volume that should be brought into view.
         * @remarks
         * Bounding volumes can be gotten from the scene itself, or an selection of objects within the scene.
         * A typical case is to update the 3D view to reflect some object selection.
         * The controller will attempt to position the camera at a reasonable distance from the specified volume, using its center as the focal point.
         * The controller will not attempt to avoid moving through walls etc.
         */
        zoomTo(bounds: BoundingSphere): void;

        /** Move camera to exact position and rotation. */
        moveTo(position: ReadonlyVec3, rotation: ReadonlyQuat): void;

        /** Whether controller is enabled. Default is true. */
        enabled: boolean;

        /** Whether to automatically zoom to scene extents when new scene is selected. Default is true. */
        autoZoomToScene?: boolean;

        // /** Controller parameters */
        readonly params: Required<CameraControllerParams>;
    }

    /** Static camera motion controller parameters. */
    export interface StaticControllerParams {
        /** The kind of camera controller. */
        readonly kind: "static";

        /** The world space coordinate of the camera itself (default [0,0,1]). */
        position?: ReadonlyVec3;

        /** The world space coordinate to look at (default [0,0,0]). */
        target?: ReadonlyVec3;

        /** The world space up vector (default [0,1,0]). */
        up?: ReadonlyVec3;
    }

    /** Turntable camera motion controller parameters. */
    export interface TurntableControllerParams {
        /** The kind of camera controller. */
        readonly kind: "turntable";

        /** The world space coordinate to orbit around. */
        pivotPoint?: ReadonlyVec3;

        /** The camera distance relative to pivot point in meters. */
        distance?: number;

        /** The camera elevation relative to pivot point in meters. */
        elevation?: number;

        /** The current turntable rotation angle in degrees (+/-180) */
        rotation?: number;

        /** The velocity with which the camera rotates in degrees/second. */
        rotationalVelocity?: number;
    }

    /** Orbit type camera motion controller */
    export interface OrbitControllerParams {
        /** The kind of camera controller. */
        readonly kind: "orbit";

        /** The world space coordinate to orbit around. (0,0,0) is default. */
        pivotPoint?: ReadonlyVec3;

        /** The current pitch of camera in degrees (+/-90) */
        pitch?: number;

        /** The current yaw of camera in degrees (+/-180) */
        yaw?: number;

        /** The camera distance relative to pivot point in meters. */
        distance?: number;

        /** The camera distance relative to pivot point in meters. */
        maxDistance?: number;

        /** The velocity with which the camera moves through space in meters/second */
        linearVelocity?: number;

        /** The velocity with which the camera rotates in degrees/second. */
        rotationalVelocity?: number;
    }

    /** Flight type camera motion controller */
    export interface FlightControllerParams {
        /** The kind of camera controller. */
        readonly kind: "flight";

        /** The world space coordinate of camera. (0,0,0) is default. */
        position?: ReadonlyVec3;

        /** The world space coordinate to orbit around. (0,0,0) is default. */
        pivotPoint?: ReadonlyVec3 | false;

        /** The current pitch of camera in degrees (+/-90) */
        pitch?: number;

        /** The current yaw of camera in degrees (+/-180) */
        yaw?: number;

        /** The velocity with which the camera moves through space in meters/second */
        linearVelocity?: number;

        /** The allow automatic zoom velocity according last pivot point distance */
        autoZoomSpeed?: boolean;

        /** Near camera clipping distance */
        near?: number;

        /** Far camera clipping distance */
        far?: number;

        /** Camera flight time in zoomTo*/
        flightTime?: number;

        /** Camera Field of View in degrees */
        fieldOfView?: number;

        /** Camera speed based on distance from focal point */
        proportionalCameraSpeed?: { min: number, max: number; pickDelay: number; };
    }

    /** Flight type camera motion controller */
    export interface OrthoControllerParams {
        /** The kind of camera controller. */
        readonly kind: "ortho";

        /** The world space reference coordinate system to move along. Identity matrix is default. */
        referenceCoordSys?: ReadonlyMat4;

        /** The position in the reference coordinate system. (0,0,0) is default. */
        position?: ReadonlyVec3;

        /** The velocity with which the camera moves through space in meters/second */
        linearVelocity?: number;

        /** Near camera clipping distance */
        near?: number;

        /** Far camera clipping distance */
        far?: number;

        /** Camera (vertical) field of view in meters. */
        fieldOfView?: number;

        /** Use pointer lock on zooming with mouse */
        pointerLockOnPan?: boolean;
    }

    export type CameraControllerParams = StaticControllerParams | TurntableControllerParams | OrbitControllerParams | FlightControllerParams | OrthoControllerParams;

    /** Neutral highlight parameters */
    export interface NeutralHighlightParams {
        /** The kind of highlight. */
        kind: "neutral";
    }

    /** Transparent highlight parameters */
    export interface TransparentHighlightParams {
        /** The kind of highlight. */
        kind: "transparent";
        /** The opacity to assign. Value must between 0.0 (fully transparent) and 1.0 (fully opaque) */
        opacity: number;
    }

    /** Color assign highlight parameters */
    export interface ColorHighlightParams {
        /** The kind of highlight. */
        kind: "color";
        /** The color to assign. */
        color: ColorRGB | ColorRGBA;
    }

    /** Red, green, blue, alpha transform highlight parameters */
    export type RGBATransformHighlightParams = {
        /** The kind of highlight. */
        kind: "rgba";
    } & AtLeastOne<RGBAOptions>;

    /** Hue, saturation, lightness, alpha transform highlight parameters */
    export type HSLATransformHighlightParams = {
        /** The kind of highlight. */
        kind: "hsla";
    } & AtLeastOne<HSLAOptions>;

    export type HighlightParams = NeutralHighlightParams | TransparentHighlightParams | ColorHighlightParams | RGBATransformHighlightParams | HSLATransformHighlightParams;

    /** Output from object picking */
    export interface PickInfo {
        /** ObjectId of picked object */
        objectId: ObjectId;
        /** World space position of picked pixel */
        position: ReadonlyVec3;
        /** World space normal of picked pixel */
        normal: ReadonlyVec3;
    }

    /** Rendering performance statistics */
    export interface PerformanceStatistics {
        /** # milliseconds spent on various aspects of rendering last frame. */
        readonly cpuTime: {
            readonly animation: number; // time spent in main thread doing camera updates and animations
            readonly render: {
                readonly draw: number; // time spent on WebGL rendering
                readonly update: number; // time spent updating GPU buffers
            };
            readonly geometry: {
                readonly update: number; // time spent traversing and updating octree
            };
        };
        /** # milliseconds spent on GPU to render last frame. 
         * @remarks This requires EXT_disjoint_timer_query_webgl2, which currently is only supported on chrome for PC and Mac.
         */
        readonly gpuTime: number | undefined;
        /** # gpu bytes allocated by static geometry. */
        readonly gpuBytes: number | undefined;
        /** # milliseconds since last frame was rendered.
         * @remarks
         * This value is an approximation of framerate when moving the camera. 
         * It is used to automatically adjust render resolution in cases where the framerate drops below a certain threshold.
         * If the last render was triggered by anything other than camera movement, e.g. an update in the scene or a post effect loop, this value will be undefined.
         */
        readonly frameInterval: number | undefined;
        /** # Triangles rendered in last frame. */
        readonly triangles: number;
        /** # Points rendered in last frame. */
        readonly points: number;
        /** # draw calls emitted in last frame. */
        readonly drawCalls: number;
        /** Are all pending nodes loaded and sent to rendering pipeline? */
        readonly sceneResolved: boolean;
        /** Camera generation */
        readonly cameraGeneration: number;
    }

    /** Parameters for directional lighting. */
    export interface DirectionalLight { }

    /** Node for terrain elevation color gradient curve. */
    export interface ElevationColorGradientNode {
        /** Elevation above/below sea level in meters. */
        readonly elevation: number;
        /** Color to use at this elevation. */
        readonly color: ColorRGB;
    }

    /** Node for point cloud deviation color gradient curve. */
    export interface DeviationColorGradientNode {
        /** Deviation. */
        readonly deviation: number;
        /** Color to use at this deviation. */
        readonly color: ColorRGBA;
    }

    /** Node for point cloud intensity color gradient curve. */
    export interface IntensityColorGradientNode {
        /** Intensity. */
        readonly intensity: number;
        /** Color to use at this deviation. */
        readonly color: ColorRGBA;
    }

    /** Render settings
     * @remarks
     * These settings controls various visual aspects of the 3D view.
     */
    export interface RenderSettings {
        /** Display settings */
        readonly display: {
            /** Render width in pixels.
             * @remarks 
             * This number must be an integer!
             * Also note that if you pass in a canvas when creating the view, that canvas' pixel size (.width) will be set the same as this display size.
             */
            width: number;
            /** Display height in pixels.
             * @remarks
             * This number must be an integer!
             * Also note that if you pass in a canvas when creating the view, this canvas' pixel size (.height) will be set the same as this display size.
             */
            height: number;
        };

        /** Grid settings */
        readonly grid: {
            /** Enable grid plane. */
            enabled: boolean;
            /** Number of major lines, odd number needed to have lines go through origo. */
            majorLineCount: number;
            /** Number of minor lines between major lines. */
            minorLineCount: number;
            /** Origo of the grid */
            origo: ReadonlyVec3;
            /** X axis of the grid, length determines the distance between lines*/
            axisX: ReadonlyVec3;
            /** Y axis of the grid, length determines the distance between lines*/
            axisY: ReadonlyVec3;
            /** Color of major grid lines*/
            majorColor: ColorRGB;
            /** Color of minor grid lines*/
            minorColor: ColorRGB;
        };

        /** Settings for rendering of background.
         */
        readonly background: {
            /** Background color.
             * @remarks
             * Setting the alpha component < 1 will generate a transparent background.
             * If undefined, background will use image from environment map, or default color if no environment is set.
             */
            color: ColorRGBA | undefined;

            /** Blur factor when drawing background skybox.
             * @remarks
             * 0 = no blur, 1 = max blur.
             * This settings only applies when an environment map is used.
             */
            skyBoxBlur: number;
        };

        /** Clipping planes settings.
         * @deprecated Use clippingVolume instead.
         * @remarks
         * Clipping planes allows for an axis alligned box to define what volume will be rendered or not.
         * This is useful for rendering various cross sections and revealing internal geometry.
         */
        readonly clippingPlanes: {
            /** Whether to clip geometry by the actual bounding box or not. */
            enabled: boolean;
            /** Whether to clip geometry inside or outside the actual bounding box. */
            inside: boolean;
            /** Whether to show the actual bounding box or not. */
            showBox: boolean;
            /** The axis aligned bounding volume. */
            bounds: AABB;
            /** Highlighted side. */
            highlight: number;
        };

        /** Clipping volume settings.
         * @remarks
         * Clipping volume allows for a set of up to 6 planes to define a volume that excluded from rendering.
         * This is useful for rendering various cross sections and revealing internal geometry.
         */
        readonly clippingVolume: {
            /** Whether to clip geometry by the actual bounding box or not. */
            enabled: boolean;
            /** How multiple clipping planes are combined. Default: "union" */
            mode: "intersection" | "union";
            /** List of clipping planes (max 6), expressed as plane normal (x,y,z) and offset from origo (w) in a 4D world space vector. */
            planes: readonly ReadonlyVec4[];
        };

        /** Current background/IBL environment.
         * @remarks
         * Environments are a pre-baked set of textures for background and lighting information.
         * For retrieving a list of available environments, see {@link API.availableEnvironments}.
         * An environment must be loaded before it can be assigned here, via {@link View.loadEnvironment}.
         * Assigning an environment impacts lighting if no {@link light.sun} is defined, and also background images {@link background} if no color is defined.
         * Image based lighting (IBL) uses light information from HDRI panoramic images to create a more natural looking light and ambience.
         * If undefined, a basic directional sun lighting model will be used instead, allowing for dynamic changes in light color and direction at the expense of esthetics.
         */
        environment?: Environment;

        /** Camera light exposure as stops of power of 2.
         * @remarks
         * Negative values darkens the image, while positive ones brightens it.
         * The default value is 0.0.
         */
        exposure?: number;

        /** Light settings */
        readonly light: {
            /** Ambient hemisphere light, emulating indirect light scattered from atmosphere. */
            readonly ambient: {
                /** Brightness expressed as a scalar from 0.0 (none), to 1.0 (max). */
                brightness: number;
            };

            // /** Pre-baked indirect illumination.
            //  * @remarks
            //  * As calculating indirect illumination is a very compute intensive operation, it is currently performed as a pre-process stage on dedicated servers in the cloud.
            //  * Not all models undergoes this process, however, and changes to e.g. sunlight and scene composition will require a rebake for correct lighting.
            //  */
            // readonly baked: {
            //     /** Brightness expressed as a scalar from 0.0 (none), to 1.0 (sunny). */
            //     brightness: number;
            //     /** Range of input values to use, expressed as a [low,high] range, typically [0,1] in most cases. */
            //     readonly range: [low: number, high: number];
            // };

            /** Camera local light. */
            readonly camera: {
                /** Brightness expressed as a scalar from 0.0 (none), to 1.0 (bright). */
                brightness: number;
                /** Fall-off distance, beyond which this light is effectively disabled. */
                distance: number;
            };

            /** Direct sunlight. */
            readonly sun: {
                /** Brightness expressed as a scalar from 0.0 (none), to 1.0 (sunny). */
                brightness: number;
                /** Sun position on the sky. */
                readonly position: {
                    /** Solar azimuth angle in degrees, where 0° is due north, 90° is due east and 270° due west. */
                    azimuth: number;
                    /** Solar elevation angle in degrees, where 0° at the horizon and 90° is straight up. */
                    inclination: number;
                };
                /** If set then sun {@link position} on the sky will be calculated automatically based on scene {@link Scene.location}, {@link Scene.timezone} and this time. */
                time?: Date;
            };

            // /** Shadows settings (default settings should work in most cases). */
            // readonly shadows: {
            //     /** enable shadows (default: false). */
            //     enabled: boolean;
            //     /** Default value = -0.000005. */
            //     bias: number;
            //     /** Default value = -200. */
            //     left: number;
            //     /** Default value = 200. */
            //     right: number;
            //     /** Default value = -200. */
            //     bottom: number;
            //     /** Default value = 200. */
            //     top: number;
            // };
        };

        /** Color transforms for various highlighting groups.
         * @remarks
         * These highlights are used by the {@link scene.objectHighlighter}.
         * Modifing the highlights is done by assigning a new array, rather than mutating the existing one.
         * The maximum number of highlights supported is currently 256, whereof the last (255) is reserved for hidden objects.
         * The highlight at index 0 is the initial default for all objects and can be used to e.g. highlight all objects that are not selected or otherwise part of another highlighting group.
         */
        objectHighlights: readonly Highlight[];

        /** Ocean render settings
         * @remarks
         * If undefined, ocean geometry will not be rendered.
         */
        readonly ocean: {
            /** Ocean color */
            color: ColorRGB;
            /** Enable ocean rendering (default false). */
            enabled: boolean;
            /** Ocean opacity (default 0.5).*/
            opacity: number;
        };

        /** Point cloud settings.
         * @remarks
         * The sizes are cumulative and computed as follows:
         * ``effective_point_pixel_size = max(1, pixelSize + projectedSizeOf(metricSize + tolerance * toleranceFactor))``.
         * Metric size is projected as a 3D sphere at the point origo to deterine pixel size.
         * The term pixel refers to the size of a pixel in the target canvas element, which resolution may differ from that of the render buffer.
         */
        readonly points: {
            /** Point shape. Default is "disc". */
            shape: "disc" | "square";

            readonly size: {
                /** Point size in pixels. */
                pixel: number | undefined;
                /** Max point size in pixels. */
                maxPixel: number | undefined;
                /** Point size in meters. */
                metric: number | undefined;
                /** The scaling factor for applying the tolerance of the current level of detail to point size.
                 * @remarks
                 * Different levels of detail (LOD) will have different point densities.
                 * Taking this difference into account may result in a more uniform point coverage and visually pleasing result.
                 * The tolerance of each LOD reflects the point merging distance threshold in meters used to reduce # points, or 0 for the original level of detail.
                 */
                toleranceFactor: number;
            };

            readonly deviation: {
                mode: "on" | "off" | "mix";
                index: number;
                colors: readonly DeviationColorGradientNode[];
            };

            readonly intensity: {
                mode: "on" | "off" | "mix";
                colors: readonly IntensityColorGradientNode[];
            };
        };

        /** Render quality settings for adjusting performance to various devices */
        readonly quality: {
            // /** Apply temporal antialiasing when camera stops moving. */
            // antiAliasing: boolean;

            /** Geometry detail settings. */
            readonly detail: {
                /** Level of geometry detail. 1.0 = reasonable default, >1 more detail, <1 less detail.
                 * @remarks
                 * This is a relative value and will be multiplied by the device performance profile when rendering.
                 */
                value: number;

                /** Max limit for # of bytes used for geometry and textures in static LOD geometry.
                 * @remarks
                 *  Adjust this to accomodate memory constraints of your device.
                 *  Default value is undefined, which will use a conservative limit for your type of device.
                 *  The # bytes does not include memory used for mipmapping or device specific format conversions.
                 *  Hardware compressed textures only count for the compressed byte size.
                 *  GPU memory from DynamicObjects are not included in the triangle count and thus not contrained by this value.
                 */
                maxLodGPUBytes?: number;
            };

            /** Resolution settings. */
            readonly resolution: {
                /** Level of pixel resolution, where 1.0 = 1:1 ratio (default) and values lesser than 1 will render in lower resolution than screen and scale up for increased performance.
                 * @remarks
                 * This is a relative value and will be multiplied by the device performance profile when rendering.
                 */
                value: number;
            };
        };

        /** Terrain render settings
         * @remarks
         * If undefined, terrain geometry will not be rendered.
         */
        terrain: {
            /** Elevation gradient color curve, defined by a list of nodes.
             * @remarks
             * Nodes must be sorted in ascending order of elevation!
             * Elevations are defined as in meters above/below sea level (using negative values for sub sea terrain).
             * At least two nodes are required for any sort of gradient.
             * Nodes do not have to be uniformly distributed elevation-wise.
             * To create a discontinuity in the gradient, two adjacent nodes with identical elevation, but different colors may be used.
             * Any elevation outside the min/max range defined by this list will be clamped to the color of the nearest node (min or max), i.e., no extrapolation will occur.
             */
            elevationColors: readonly ElevationColorGradientNode[];

            /** Draw terrain as background */
            asBackground: boolean;
        };

        readonly pickBuffer: {
            includeTransparent: bool;
        };
    }

    type RecursivePartial<T> = {
        [P in keyof T]?: RecursivePartial<T[P]>;
    };

    type RecursiveReadonly<T> = {
        readonly [P in keyof T]: RecursiveReadonly<T[P]>;
    };

    /** A partial, read only variant of render settings for initial settings and updates. */
    export type RenderSettingsParams = RecursivePartial<Readonly<RenderSettings>>;

    /** Grayscale post effect. */
    export interface GrayscaleParams {
        /** Post effect kind/discriminator. */
        readonly kind: "gs";
        /** 3x3 matrix for color transformation matrix for e.g. sephia look. */
        readonly colorTransform?: ReadonlyMat3;
    }

    /** Temporal antialiasing post effect.
     * @remarks
     * This post effect is intended to be applied over several frames of an unchanging view, i.e. when the camera stops moving and the scene is fully resolved.
     * After a few dozen frames, edges will appear smoother.
     * To save energy, you probably only want to run this effect for a second or two, whenever your image is smooth enough.
     */
    export interface TemporalAntialiasingParams {
        /** Post effect kind/discriminator. */
        readonly kind: "taa";
        /** Sampling radius in # pixels. */
        readonly radius?: number;
        /** Flag to reset accumulation of images, e.g. after the view changed. */
        readonly reset?: boolean;
    }

    /** Outline rendering post effect.
     * @remarks
     * This post effects helps visualize faces that are perpendicular to the view plane as lines.
     * Normally such faces would not be visible, which is especially a problem when using orthographic camera projection.
     * This effect effectively re-renders the entire scene, so you may only want to run it after the view stops changing.
     */
    export interface OutlineParams {
        /** Post effect kind/discriminator. */
        readonly kind: "outline";
        /** Outline color, or original color if undefined. */
        readonly color?: ReadonlyVec4;
    }

    /** Screen space ambient occlusion post effect.
     * @remarks
     * This post effect is intended to be applied over several frames of an unchanging view, i.e. when the camera stops moving and the scene is fully resolved.
     * Ambient occlusion is a shadowing effect that makes geometry easier to visually interpret and more pleasing to the eye.
     * This effect can be quite demanding on weaker devices, so use over several frames with care to avoid stuttering when view changes.
     */
    export interface ScreenSpaceAmbientOcclusionParams {
        /** Post effect kind/discriminator. */
        readonly kind: "ssao";
        /** Neighborhood sampling radius in # pixels. */
        readonly radius: number;
        /** # of samples per pixel. */
        readonly samples: number;
        /** Flag to reset accumulation of images, e.g. after the view changed. */
        readonly reset?: boolean;
        /** Whether to ignore transparent pixels or not. */
        readonly skipOpacity?: boolean;
    }

    export type PostEffectParams = GrayscaleParams | TemporalAntialiasingParams | ScreenSpaceAmbientOcclusionParams | OutlineParams;

    export interface MeasureInfo {
        /** ObjectId of picked object */
        objectId: ObjectId;
        /** World space position of picked pixel */
        position: ReadonlyVec3;
        /** Undefined if the point is on an edge */
        normalVS: ReadonlyVec3 | undefined;
        /** Deviation of picked pixel */
        deviation: number | undefined;
    }

    /** Flags reflecting what changes has occured since last render. */
    export interface RenderChanges {
        /** Has camera changed? */
        readonly camera: boolean;
        /** Has scene changed? */
        readonly scene: boolean;
        /** Has renderSettings changed? */
        readonly settings: boolean;
        /** Miscellaneous changes. */
        readonly misc: boolean;
    }

    export interface RenderOutput {
        // readonly viewWorldMatrix: ReadonlyMat4;
        // readonly viewClipMatrix: ReadonlyMat4;
        // readonly worldViewMatrix: ReadonlyMat4;

        /** Pick nearest object (if any) at the specified pixel coordinate.
         * @param x view x coordinate (0=left) in css pixels.
         * @param y view y coordinate (0=top) in css pixels.
         * @returns `undefined` if no object intersection was found.
         * @remarks
         * X and Y coordinates are relative to the {@link RenderSettings.display} size.
         * If you set this using clientWidth and clientHeight, you can use the x and y coordinates from html events directly, as everything is in css pixels.
         * If you multiplied size with devicePixelRatio, you must also multiply this with mouse event coordinates to get physical pixels, not css pixels.
         */
        pick(x: number, y: number, pickCameraPlane: boolean = false): Promise<PickInfo | undefined>;

        /** Get {@link MeasureInfo} of nearest object (if any) at the specified pixel coordinate.
         * @param x view x coordinate (0=left) in css pixels.
         * @param y view y coordinate (0=top) in css pixels.
         * @returns `undefined` if no object intersection was found.
         * @remarks
         * X and Y coordinates are relative to the {@link RenderSettings.display} size.
         * If you set this using clientWidth and clientHeight, you can use the x and y coordinates from html events directly, as everything is in css pixels.
         * If you multiplied size with devicePixelRatio, you must also multiply this with mouse event coordinates to get physical pixels, not css pixels.
         */
        measure(x: number, y: number): Promise<MeasureInfo | undefined>;

        /** Apply post effect to output image.
         * @param params Post effect type and related parameters.
        */
        applyPostEffect(params: PostEffectParams): Promise<void | boolean>;

        /** Get rendered image.
         * @remarks
         * Please note that this function only works/makes sense if you did not specify your own canvas in {@link API.createView}!
         * It is intended for retrieving the rendered image from the OffscreenCanvas created on browsers that supports it.
         * In this case,the Image is tranferred to the calling worker and no longer available for post effects, etc.
         */
        getImage(): Promise<ImageBitmap | undefined>;

        /** Check if there are any changes since this render. */
        hasChanged(): Promise<undefined | RenderChanges>;

        /** Returns true if this is an idle frame, delayed after camera movement*/
        isIdleFrame(): boolean;

        /** The statisics for this render. */
        readonly statistics: PerformanceStatistics;

        /** The settings for this render.
         * @remarks
         * These are a copy of the view rendersettings at the time of the render.
         * Some values may have been modified to reflect computations, such as effective resolution.
         */
        readonly renderSettings: RecursiveReadonly<RenderSettings>;
    }

    /** A 3D view.
     * @remarks
     * 3D views will render a scene into a provided canvas element.
     * Any changes to the scene, camera or settings are automatically rendered in a background animation loop.
     * When the camera stops moving, additional frames may also be rendered to incrementally refine the quality of the output image over a certain period.
     * Setting the {@link render} property to false will stop such automatic updates.
     */
    export interface View {
        /** The scene to render.
         * @remarks
         * Assigning a new scene initiates a sequence of geometry downloads that may take a few seconds to produce any visual results and then refine over time.
         */
        scene?: Scene;

        /** The camera to use. */
        camera: Camera;

        // /** An HTML element used to automatically resize the canvas to changes in layout.
        //  * @remarks
        //  * By default this will be the parent element of the HTMLCanvasElement, or undefined in the case of OffscreenCanvas.
        //  * You may set it to any HTMLElement, however, or undefined to disable automatic resize.
        //  */
        // container?: HTMLElement | undefined;

        /** Render the next frame.
         * @remarks
         * This function is meant to be called in a loop.
         * You should avoid calling it from a timer or a requestAnimationFrame callback since it's already being throttled to the screen's vertical blanking.
         * If the existing state has already been rendered, it will wait until there are changes before initiating a new render.
         * The returned render output object will have methods for post processing and for getting an image you can display in your own canvas.
         * You must call `dispose()` on the returned render output object before you can call this function again.
         * @returns A promise of the rendered output.
         */
        render(frameCallback?: () => void): Promise<RenderOutput>;

        /** Current render settings. */
        readonly settings: RenderSettings;

        /** Apply render settings changes using deep copy.
         * @param changes changes to current render settings.
         */
        applySettings(changes: RenderSettingsParams): void;

        /** Dynamically adjust render quality to match device performance.
         * @param framerateTargets The maximum # of milliseconds between rendered frames before reducing resolution, 
         * and minimum # of milliseconds for restoring quality. Default is 200ms, or 5 frames/second and 33.3 ms, or 30 fps
         * @remarks
         * Calling this function may reduce render resolution when rendering performance drops below the specified threshold.
         * This is particularly useful to maintain acceptable performance on mobile devices with limited fillrate and triangle capacity.
         * @returns The last measured median frame interval, or undefined if not yet available.
         */
        adjustQuality(framerateTargets?: { lowerBound: number, upperBound: number; }): number | undefined;

        /** Performance statistics from previously rendered frame. */
        readonly performanceStatistics: PerformanceStatistics;

        /** Transfer recently rendered image to a bitmap.
         * @returns A Promise to the transferred bitmap or undefined if device/browser does not yet support this functionality.
         * @remarks See {@link https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas/transferToImageBitmap} for more details.
         */
        transferToImageBitmap(): Promise<ImageBitmap | undefined>;

        /** Convert image to a data blob.
         * @param options Image encoding options.
         * @returns A Promise to a Blob object representing the latest rendered image or undefined if device/browser does not yet support this functionality.
         * @remarks See {@link https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas/convertToBlob} for more details.
         */
        convertToBlob(options?: ImageEncodeOptions_): Promise<Blob | undefined>;

        /** The last rendered frame, if any. */
        readonly lastRenderOutput: RenderOutput | undefined;

        /** Signal changed camera to force rerender. */
        invalidateCamera(): void;
    }

    /** Database interface to retrive object's data in scene. Used internally from loaded {@link Scene} interface.
     * @remarks
     * This interface is usually created automatically based on scene creation.
     * You may make your own implementation for custom data model, e.g. for testing or in-house databases.
     */
    export interface ObjectDB {
        /** Get {@link ObjectData} by scene object id */
        getObjectMetdata(id: number): Promise<ObjectData>;

        /** Search for objects.
         * @param filter {@link SearchOptions} filtering options.
         * @param signal Abort request signal.
         * @remarks
         * See {@link Scene.search} for more details.
         * @returns Async iterator of {@link HierarcicalObjectReference}
         */
        search(filter: SearchOptions, signal: AbortSignal | undefined): AsyncIterableIterator<HierarcicalObjectReference>;
    }

    /** Background/IBL environment description */
    export interface EnvironmentDescription {
        /** Display name of environment */
        readonly name: string;

        /** Data URL. */
        readonly url: string;

        /** Thumbnail URL. */
        readonly thumnbnailURL: string;
    }

    /** An in-memory instance of an environment, ready for rendering. */
    export interface Environment {
        /** Loaded environment id. */
        readonly id: number;

        /** Unload environment instance and release all resources.
         * @remarks
         * It is safe to call this function on an environment if it's currently not assigned to any view, or if all assigned views have rendered it at least once.
         */
        dispose(): Promise<void>;
    }

    /** Host device performance profile.
     * @remarks
     * This profile is used to adjust rendering quality and detail to fit the contraints of of the host device.
     */
    export interface DeviceProfile {
        /** Device type name. */
        readonly name: string;
        /** Whether WebGL has some major performance caveat, such as CPU or remote rendering. */
        readonly hasMajorPerformanceCaveat: boolean;
        /** Is this a device weak, i.e. unsuitable for demanding post processing and rendering techniques? */
        readonly weakDevice: boolean;
        /** Does the host device have a discrete GPU / graphics card. */
        readonly discreteGPU: boolean; // used to determine what effects to run while camera is moving vs. static.
        /** Render resolution bias. */
        readonly renderResolution: number;
        /** Render resolution bias for when camera is not moving. */
        readonly renderResolutionIdle: number;
        /** Texture resolution bias. */
        readonly textureResolution: number;
        /** Geometry detail bias. */
        readonly detailBias: number;
        /** # of frames to idle to avoid crashes/kill due to excessive power consumption on problematic mobile devices. */
        readonly throttleFrames: number;
        /** Hard limit of gpu memory usage for static geometry. */
        readonly gpuBytesLimit: number;
        /** Hard limit of # triangles for static geometry. */
        readonly triangleLimit: number;
        /** Detail bias when using orthographic camera. */
        readonly orthoDetailBias?: number;
    }

    /** A NovoRender API instance. */
    export interface API {
        /** API version string, expressed using semantic versioning {@link https://semver.org/}. */
        readonly version: string;

        /** Performance profile for current device.
         */
        deviceProfile: DeviceProfile;

        /** Stop all rendering and release all resources.
         * @remarks
         * Calling this function will effectively destroy this instance of the API and any associated scenes and views etc.
         * This function allows you to explicitly release the associated GPU resources and memory caches used by the API without waiting for the garbage collector to do so.
         */
        dispose(): void;

        /**
         * Enable or disable automatic rendering.
         * @remarks
         * This value is set to true by default when a new API is created.
         * When true, the api will use requestAnimationFrame() callback to automatically update all active views and controllers.
         * Setting it to false will have the effect of pausing all rendering and camera motion.
         * You may still call {@link update} to manually render all views frame and update camera motion controllers.
         */
        run: boolean;

        /**
         * Callback that is called on each frame just before rendering.
         * @remarks
         * Using this callback instead of in your own requestAnimationFrame() callback is recommended to ensure your updates are applied consistently and are properly synchronized.
         * If you have disabled automatic rendering by setting {@link run} = false, this callback is not called unless you manually call {@link update}.
         */
        animate: FrameRequestCallback | undefined;

        /**
         * Manually update all views and camera controllers.
         * @remarks
         * If you have disabled automatic rendering by setting {@link run} = false, you can call this function to manually update instead.
         * This may be useful if you are using requestAnimationFrame yourself and want to have full control over the order by which state gets updated.
         * The returned promise will resolve at the next animation frame, typically 1/60 of a second, which can be useful if you intend to run a realtime update loop.
         */
        update(): Promise<void>;

        /**
         * Load the specificed scene into memory.
         * @remarks
         * The loaded scene will not include all 3D or object data immediately as these are automatically downloaded on demand.
         * @param url The scene (directory) url.
         * @returns A promise of the loaded {@link Scene}.
         */
        loadScene(id: URL | string, db?: ObjectDB): Promise<Scene>;

        /**
         * Load the specificed asset into memory.
         * @remarks
         * Assets must be passed to {@link Scene.createDynamicObject} to be rendered.
         * Currently, this must be a {@link https://www.khronos.org/gltf/ glTF} file (*.gltf | *.glb).
         * Cross domain urls requires CORS headers to be set appropriately.
         * @param url The asset url.
         * @returns A promise of the loaded {@link DynamicAsset}.
         */
        loadAsset(url: URL): Promise<DynamicAsset>;

        /**
         * Load the specificed environment into memory.
         * @returns A promise of the loaded {@link Environment}.
         */
        loadEnvironment(environment: EnvironmentDescription): Promise<Environment>;

        /**
         * Create a 3D View.
         * @param settings Initial {@link RenderSettingParams} settings to use for view.
         * @param htmlRenderCanvas Canvas to render to. If none is specified, an OffscreenCanvas is used instead. Beware that not all browsers support OffscreenCanvas yet.
         * @remarks It is recommend that you specify the initial display pixel width and height here to avoid unnecessary reallocation of render buffers.
         * @returns A promise of a newly created {@link View}.
         */
        createView(settings?: RenderSettingsParams, htmlRenderCanvas?: HTMLCanvasElement): Promise<View>;

        /** Create an object highlight
         * @param params Highlight parameters.
         * @returns A highlight object that can be used in {@link RenderSettings.objectHighlights}.
         */
        createHighlight(params: NeutralHighlightParams): Highlight;

        /** Create an object highlight
         * @param params Highlight parameters.
         * @returns A highlight object that can be used in {@link RenderSettings.objectHighlights}.
         */
        createHighlight(params: TransparentHighlightParams): Highlight;

        /** Create an object highlight
         * @param params Highlight parameters.
         * @returns A highlight object that can be used in {@link RenderSettings.objectHighlights}.
         */
        createHighlight(params: ColorHighlightParams): Highlight;

        /** Create an object highlight
         * @param params Highlight parameters.
         * @returns A highlight object that can be used in {@link RenderSettings.objectHighlights}.
         */
        createHighlight(params: RGBATransformHighlightParams): Highlight;

        /** Create an object highlight
         * @param params Highlight parameters.
         * @returns A highlight object that can be used in {@link RenderSettings.objectHighlights}.
         */
        createHighlight(params: HSLATransformHighlightParams): Highlight;

        /**
         * Create a camera motion controller.
         * @param params The controller parameters.
         * @returns The controller object
         */
        createCameraController(params: StaticControllerParams): CameraController;

        /**
         * Create a camera motion controller.
         * @param params The controller parameters.
         * @returns The controller object
         */
        createCameraController(params: TurntableControllerParams): CameraController;

        /**
         * Create a camera motion controller.
         * @param params The controller parameters.
         * @param domElement The HTML DOM element to listen for mouse/touch events. This can only be set when the controller is created.
         * @returns The controller object
         */
        createCameraController(params: OrbitControllerParams, domElement: HTMLElement): CameraController;

        /**
         * Create a camera motion controller.
         * @param params The controller parameters.
         * @param domElement The HTML DOM element to listen for mouse/touch events. This can only be set when the controller is created.
         * @returns The controller object
         */
        createCameraController(params: FlightControllerParams, domElement: HTMLElement): CameraController;

        /**
         * Create a camera motion controller.
         * @param params The controller parameters.
         * @param domElement The HTML DOM element to listen for mouse/touch events. This can only be set when the controller is created.
         * @returns The controller object
         */
        createCameraController(params: OrthoControllerParams, domElement: HTMLElement): CameraController;

        /**
         * Retrieve list of available background/IBL environments.
         * @param indexUrl The absolute or relative url of the index.json file. Relative url will be relative to the novorender api script url. If undefined, "/assets/env/index.json" will be used by default.
         * @param domElement The HTML DOM element to listen for mouse/touch events. This can only be set when the controller is created.
         * @returns The controller object
         */
        availableEnvironments(indexUrl?: string): Promise<readonly EnvironmentDescription[]>;
    }

    /** API creation options */
    export interface APIOptions {
        /** Flag to disable use of offscreen canvas. */
        noOffscreenCanvas?: boolean;
        /** Base URL from where to load worker script and wasm files.
         * @remarks
         * The URL can be absolute or relative to the location of the main api script.
         */
        scriptBaseUrl?: string;
    }

    /**
     * Create an instance of the NovoRender API.
     * @param options Custom settings {@link APIOptions} to create API.
     * @returns An initialized API object
     * @throws Error if current browser and device has insufficient 3D rendering capabilities.
     */
    export function createAPI(options?: APIOptions): API;

    /**
     * List of well known scene ids used for testing or demos.
     */
    export const enum WellKnownSceneUrls {
        empty = "empty",
        cube = "cube",
        condos = "https://api.novorender.com/assets/scenes/18f56c98c1e748feb8369a6d32fde9ef/",
    }

    // Extended interfaces for internal use only
    export namespace Internal {
        export interface CameraExt extends Camera {
            readonly hasChanged: boolean; // has camera values been changed since last update/render?
            readonly generation: number;
        }

        export interface CameraControllerExt extends CameraController {
            update(camera: Camera | undefined, sceneVolume: BoundingSphere | undefined, deltaTime: number): void;
            connect(): void;
            disconnect(): void;
        }

        export interface RenderSettingsExt extends RenderSettings {
            readonly diagnostics: {
                maxQueueSize: number;
                holdDynamic: boolean;
                showBoundingBoxes: boolean;
            };

            /** Advanced render settings. */
            readonly advanced: {
                /** Double sided face rendering. */
                readonly doubleSided: {
                    /** Render opaque surfaces as double sided. */
                    opaque: boolean;
                    /** Render transparent surface as double sided. */
                    transparent: boolean;
                };
                /** Hide Terrain */
                hideTerrain: boolean;
                /** Hide Point Clouds */
                hidePoints: boolean;
                /** Hide triangulated geometry */
                hideTriangles: boolean;
                /** Hide lines */
                hideLines: boolean;
                /** Hide documents */
                hideDocuments: boolean;
                /** Display debug frame buffers (0=colors, 1=normal, 2=depth, 3=object_id) */
                displayBuffer: number;
                /** Bitwise mask for what buffer to render into (0x01=color, 0x02=normal, 0x04=depth, 0x08=object_id) */
                renderBufferMask: number;
                /** Terrain quality bias limit */
                terrainBiasLimit: number;
                /** Documents quality bias limit */
                documentsBiasLimit: number;
            };
            readonly outline: {
                enable: boolean;
                color?: ReadonlyVec4;
            };
            readonly generation: number;
        }
    }
}




