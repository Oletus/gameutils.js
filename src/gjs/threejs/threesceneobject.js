
import { objectUtil } from "../utiljs.js";

/**
 * An object that owns a THREE.Object3D.
 * @constructor
 */
const ThreeSceneObject = function() {
};

/**
 * Initialize.
 * @param {Object} options Options with the following keys:
 *   sceneParent (Object3D): Parent of the object in the scene.
 *   object (Object3D): Object that this object will own and add under sceneParent.
 */
ThreeSceneObject.prototype.initThreeSceneObject = function(options) {
    var defaults = {
        sceneParent: null,
        object: null
    };
    objectUtil.initWithDefaults(this, defaults, options);
    this._inScene = false;
};

/**
 * Add this object to the scene if it is not there.
 */
ThreeSceneObject.prototype.addToScene = function() {
    if (!this._inScene) {
        this.sceneParent.add(this.object);
        this._inScene = true;
    }
};

/**
 * Remove this object from the scene if it is in there.
 */
ThreeSceneObject.prototype.removeFromScene = function() {
    if (this._inScene) {
        this.sceneParent.remove(this.object);
        this._inScene = false;
    }
};

/**
 * @param {THREE.Object3D} object Object to query.
 * @return {boolean} True if object is in the owned part of the scene graph.
 */
ThreeSceneObject.prototype.ownsSceneObject = function(object) {
    var matches = false;
    this.getOwnQueryObject().traverse(function(obj) {
        if (obj === object) {
            matches = true;
        }
    });
    return matches;
};

/**
 * Override this to customize which parts of the scene this object is considered to own for the purposes of
 * ownsSceneObject.
 * @return {THREE.Object3D} object this object owns
 */
ThreeSceneObject.prototype.getOwnQueryObject = function() {
    return this.object;
};

/**
 * Update the object. Override this to do time-based updates.
 */
ThreeSceneObject.prototype.update = function(deltaTime) {
};



/**
 * Base type for objects that display a text string as a Three.js mesh.
 * Use classes that inherit this class, like ThreeExtrudedTextObject to display text in the 3D scene.
 * @constructor
 */
const ThreeTextObject = function() {
};

ThreeTextObject.prototype = new ThreeSceneObject();

/**
 * @param {Object} options
 */
ThreeTextObject.prototype.initThreeTextObject = function(options) {
    var defaults = {
        string: "",
        maxRowLength: -1,
        rowSpacing: 1.3,
        textAlign: 'center'
    };
    objectUtil.initWithDefaults(this, defaults, options);
    
    this.initThreeSceneObject(options);
    this.object = new THREE.Object3D();
    
    var string = this.string;
    this.string = "";
    this.setString(string);
};

/** 
 * @param {string} string String to display.
 */
ThreeTextObject.prototype.setString = function(string) {
    this.string = string;
    this.stringSplitToRows = stringUtil.splitToRows(this.string, this.maxRowLength);
};

/**
 * An object that displays a text string as an extruded Three.js mesh.
 * To use this, first set ThreeExtrudedTextObject.defaultFont. You can use utilTHREE.loadFont to load the font.
 * The scene object that acts as a parent to the text will be stored under the property "object" and can be accessed
 * directly to set its model transform or to add additional children.
 * @param {Object} options Options with the following keys, in addition to THREE.TextGeometry and ThreeSceneObject
 * options:
 *   string (string)
 *   maxRowLength (number): Maximum row length in characters.
 *   rowSpacing (number): Relative spacing of rows.
 *   textAlign (string): 'left', 'center' or 'right'
 *   receiveShadow (boolean)
 *   castShadow (boolean)
 * @constructor
 */
const ThreeExtrudedTextObject = function(options) {
    var defaults = {
        material: ThreeExtrudedTextObject.defaultMaterial,
        font: ThreeExtrudedTextObject.defaultFont,
        extrusionHeight: 0.1,
        curveSegments: 1,
        bevelEnabled: false,
        castShadow: false,
        receiveShadow: false
    };
    objectUtil.initWithDefaults(this, defaults, options);
    this.rowMeshes = [];
    this.initThreeTextObject(options);
};

ThreeExtrudedTextObject.defaultMaterial = new THREE.MeshPhongMaterial( { color: 0x333333, specular: 0x000000 } );
ThreeExtrudedTextObject.defaultFont = null;

ThreeExtrudedTextObject.prototype = new ThreeTextObject();

/** 
 * @param {string} string String to display.
 */
ThreeExtrudedTextObject.prototype.setString = function(string) {
    if (string != this.string) {
        ThreeTextObject.prototype.setString.call(this, string);
        for (var i = 0; i < this.rowMeshes.length; ++i) {
            this.object.remove(this.rowMeshes[i]);
        }
        this.rowMeshes.splice(0);
        for (var i = 0; i < this.stringSplitToRows.length; ++i) {
            var rowMesh = this._createTextMesh(this.stringSplitToRows[i]);
            if (this.textAlign === 'left') {
                rowMesh.position.x = -rowMesh.geometry.boundingBox.min.x;
            } else if (this.textAlign === 'right') {
                rowMesh.position.x = -rowMesh.geometry.boundingBox.max.x;
            }
            rowMesh.position.y = (this.stringSplitToRows.length - i - 0.5) * this.rowSpacing;
            this.object.add(rowMesh);
            this.rowMeshes.push(rowMesh);
        }
    }
};

/**
 * @param {string} string String to create a mesh for.
 * @return {THREE.Object3D} Text geometry object.
 */
ThreeExtrudedTextObject.prototype._createTextMesh = function(string) {
    var textGeo = new THREE.TextGeometry( string, {
        font: this.font,
        size: 1,
        height: this.extrusionHeight,
        curveSegments: this.curveSegments,
        bevelEnabled: this.bevelEnabled,
    });
    textGeo.center();
    textGeo.computeBoundingBox();
    var textMesh = new THREE.Mesh( textGeo, this.material );
    textMesh.castShadow = this.castShadow;
    textMesh.receiveShadow = this.receiveShadow;
    return textMesh;
};

export { ThreeSceneObject, ThreeTextObject, ThreeExtrudedTextObject }
