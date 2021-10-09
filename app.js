import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';
// import gsap from "gsap";

import fragment from './shaders/fragment.glsl';
import vertex from './shaders/vertex.glsl';

import t1 from './images/1.jpg';
import t2 from './images/2.jpg';
import t3 from './images/3.jpg';
import t4 from './images/4.jpg';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { CustomPass } from './js/customPass';

// import { RGBShiftShader } from "three/examples/jsm/shaders/RGBShiftShader.js";
// import { DotScreenShader } from "three/examples/jsm/shaders/DotScreenShader.js";

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.urls = [t1, t2, t3, t4];
    this.textures = this.urls.map((url) => new THREE.TextureLoader().load(url));
    console.log('this.textures :', this.textures);

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );
    this.camera.position.z = 2;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.time = 0;

    this.isPlaying = true;

    this.initPost();

    this.addMesh();
    this.resize();
    this.render();
    this.setupResize();
    this.settings();
  }

  initPost() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.effect1 = new ShaderPass(CustomPass);
    this.composer.addPass(this.effect1);

    // const effect2 = new ShaderPass(RGBShiftShader);
    // effect2.uniforms["amount"].value = 0.0015;
    // this.composer.addPass(effect2);
  }

  addMesh() {
    let that = this;
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: '#extension GL_OES_standard_derivatives: enable',
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        uTexture: { value: this.textures[0] },
        resolution: { value: new THREE.Vector4() },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      //  wireframe: true,
      //  transparent: true,
    });

    this.geometry = new THREE.PlaneGeometry(1.9 / 2, 1 / 2, 1, 1);

    this.meshes = [];
    this.textures.forEach((texture, index) => {
      let material = this.material.clone();
      material.uniforms.uTexture.value = texture;

      let mesh = new THREE.Mesh(this.geometry, material);
      this.scene.add(mesh);
      this.meshes.push(mesh);
      mesh.position.x = index - 1;
    });
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.render();
      this.isPlaying = true;
    }
  }

  settings() {
    let that = this;
    this.settings = {
      progress: 0,
      scale: 1,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, 'progress', 0, 1, 0.01);
    this.gui.add(this.settings, 'scale', 0, 10, 0.1);
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  render() {
    if (!this.isPlaying) return;

    this.meshes.forEach((mesh, i) => {
      // mesh.position.y = -this.settings.progress;
      mesh.rotation.z = this.settings.progress * (Math.PI / 2);
    });
    this.time += 0.005;
    this.material.uniforms.time.value = this.time;
    this.effect1.uniforms['time'].value = this.time;
    this.effect1.uniforms['progress'].value = this.settings.progress;
    this.effect1.uniforms['scale'].value = this.settings.scale;

    requestAnimationFrame(this.render.bind(this));
    // this.renderer.render(this.scene, this.camera);
    this.composer.render();
  }
}

new Sketch({ dom: document.getElementById('container') });
