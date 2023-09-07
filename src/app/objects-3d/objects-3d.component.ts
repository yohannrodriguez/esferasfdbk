import { Component, ElementRef, OnInit } from '@angular/core';
import * as threejsToys from 'threejs-toys';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { Reflector } from 'three/examples/jsm/objects/Reflector';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

@Component({
  selector: 'app-objects3d',
  templateUrl: './objects-3d.component.html',
  styleUrls: ['./objects-3d.component.scss'],
})
export class Objects3dComponent implements OnInit {
  private isAnimating = false;
  private composer: EffectComposer | null = null;
  private bg: any;
  private logos: THREE.Object3D[] = []; // Array para armazenar as logos

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    const appElement = this.el.nativeElement.querySelector('#app');
    this.bg = threejsToys.swarmBackground({
      el: appElement,
      eventsEl: document.body,
      gpgpuSize: 50,
      color: [Math.random() * 0xffffff, Math.random() * 0xffffff],
      geometry: 'box',
    });

    this.loadAndAnimateLogos(10000); // Carregue e anime 10 logos

    this.bg.three.camera.position.set(100, 100, 200);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Adicione luz ambiente para iluminar a cena
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Cor branca e intensidade 0.5
    this.bg.three.scene.add(ambientLight);

    // Adicione uma luz direcional para iluminar a cena
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Cor branca e intensidade 1
    directionalLight.position.set(1, 1, 1); // Defina a posição da luz direcional
    this.bg.three.scene.add(directionalLight);

    // Crie um objeto Reflector para adicionar o efeito de espelhamento
    const reflector = new Reflector(new THREE.PlaneGeometry(5000, 5000), {
      textureWidth: window.innerWidth * window.devicePixelRatio,
      textureHeight: window.innerHeight * window.devicePixelRatio,
    });
    reflector.position.y = -500;
    this.bg.three.scene.add(reflector);

    // Verifique se o composer não é nulo antes de criar os passes
    if (this.composer === null) {
      this.composer = new EffectComposer(renderer);

      const renderPass = new RenderPass(
        this.bg.three.scene,
        this.bg.three.camera
      );
      this.composer.addPass(renderPass);

      // Ajuste as configurações do UnrealBloomPass para criar um brilho estelar
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        2, // strength (aumentado para um brilho mais intenso)
        0.5, // radius (aumentado para um raio maior)
        0.8 // threshold (ajustado para brilho máximo)
      );

      this.composer.addPass(bloomPass);

      // Adicione flashes aleatórios ao clicar
      document.body.addEventListener('click', () => {
        this.addRandomFlashes();
        this.changeColors();
      });
    }
    this.animate();
  }

  private loadAndAnimateLogos(numLogos: number) {
    const loader = new GLTFLoader();
    loader.load('../../assets/gltf_logo/scene.glb', (gltf) => {
      for (let i = 0; i < numLogos; i++) {
        const modelo3D = gltf.scene.clone(); // Clone o modelo

        // Posição aleatória no espaço
        modelo3D.position.set(
          Math.random() * 200 - 100, // posição X aleatória entre -100 e 100
          Math.random() * 200 - 100, // posição Y aleatória entre -100 e 100
          Math.random() * 200 - 100  // posição Z aleatória entre -100 e 100
        );

        // Adicione o modelo à cena Three.js
        this.bg.three.scene.add(modelo3D);

        // Adicione a logo ao array de logos
        this.logos.push(modelo3D);
      }
    });
  }

  private animate() {
    // Função de atualização para animar as logos
    const animateLogos = () => {
      for (const logo of this.logos) {
        logo.position.x += 0.1; // Mova a logo ao longo do eixo X
        logo.rotation.y += 0.01; // Rode a logo em torno do eixo Y
      }

      // Solicite o próximo quadro de animação
      requestAnimationFrame(animateLogos);
    };

    animateLogos(); // Inicie a animação
  }

  private doSomethingWithModel(modelo3D: THREE.Object3D) {
    // Faça algo com o modelo3D após o carregamento
    console.log('Modelo GLTF carregado com sucesso!');
  }

  private changeColors() {
    const color1 = Math.random() * 0xffffff;
    const color2 = Math.random() * 0xffffff;
    this.bg.setColors([color1, color2]);
  }

  private addRandomFlashes() {
    // Crie flashes aleatórios
    const flashGeometry = new THREE.PlaneGeometry(
      window.innerWidth,
      window.innerHeight
    );
    const flashMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const flashMesh = new THREE.Mesh(flashGeometry, flashMaterial);
    flashMesh.position.z = -500;
    this.bg.three.scene.add(flashMesh);

    // Remova os flashes após um curto período de tempo
    setTimeout(() => {
      this.bg.three.scene.remove(flashMesh);
    }, 200);
  }
}
