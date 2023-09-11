import { Component, ElementRef, OnInit } from '@angular/core';
import * as threejsToys from 'threejs-toys';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { Reflector } from 'three/examples/jsm/objects/Reflector';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Group } from 'three'; // Importe Group da biblioteca Three.js

@Component({
  selector: 'app-objects3d',
  templateUrl: './objects-3d.component.html',
  styleUrls: ['./objects-3d.component.scss'],
})
export class Objects3dComponent implements OnInit {
  private isAnimating = false;
  private composer: EffectComposer | null = null;
  private bg: any;
  private logos: { model: Group; offset: number }[] = []; // Array para armazenar as logos

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    const appElement = this.el.nativeElement.querySelector('#app');
    this.bg = threejsToys.swarmBackground({
      el: appElement,
      eventsEl: document.body,
      gpgpuSize: 70, // padrao sem bolas 0.0001
      color: [Math.random() * 0xffffff, Math.random() * 0xffffff],
      geometry: 'sphere',
    });

    this.loadAndAnimateLogos(1000); // Carregue e anime logos

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
    loader.load('../../assets/gltf_logo/ESFERAFDBK.glb', (gltf) => {
      const domeRadius = 130; // Raio do domo invisível
      const animationAmplitude = 1; // Amplitude do movimento de onda reduzida
      const animationSpeed = 0.001; // Velocidade do movimento de onda reduzida
      let time = 0;

      for (let i = 0; i < numLogos; i++) {
        const modelo3D = gltf.scene.clone() as Group; // Alteração aqui

        // Posição aleatória no espaço dentro do domo
        const randomLongitude = Math.random() * Math.PI * 2; // Ângulo aleatório em torno do eixo Y
        const randomLatitude = Math.random() * Math.PI; // Ângulo aleatório em direção ao eixo Y
        const x =
          domeRadius * Math.cos(randomLatitude) * Math.cos(randomLongitude);
        const y = domeRadius * Math.sin(randomLatitude);
        const z =
          domeRadius * Math.cos(randomLatitude) * Math.sin(randomLongitude);

        modelo3D.scale.set(10, 10, 10); // Defina o tamanho da logo

        modelo3D.position.set(x, y, z);

        // Adicione o modelo à cena Three.js
        this.bg.three.scene.add(modelo3D);

        // Adicione a logo ao array de logos
        this.logos.push({
          model: modelo3D as Group,
          offset: Math.random() * Math.PI * 2,
        }); // Adicione um offset aleatório
      }

      // Função de atualização para animar as logos
      const animateLogos = () => {
        for (const logo of this.logos) {
          // Obtenha a posição atual da logo
          const { x, y, z } = logo.model.position;

          // Calcule uma nova posição com base em um movimento ondulante suave
          const longitude = Math.atan2(z, x);
          const latitude = Math.asin(y / domeRadius);

          const yOffset = animationAmplitude * Math.sin(time + logo.offset);
          const newX = domeRadius * Math.cos(latitude) * Math.cos(longitude);
          const newY = domeRadius * Math.sin(latitude) + yOffset;
          const newZ = domeRadius * Math.cos(latitude) * Math.sin(longitude);

          // Verifique se a logo saiu do domo invisível
          const distanceToCenter = Math.sqrt(
            newX * newX + newY * newY + newZ * newZ
          );
          if (distanceToCenter > domeRadius) {
            // Ajuste a posição de volta ao domo invisível
            const scale = domeRadius / distanceToCenter;
            logo.model.position.x = newX * scale;
            logo.model.position.y = newY * scale;
            logo.model.position.z = newZ * scale;
          } else {
            logo.model.position.set(newX, newY, newZ);
          }
        }
        // Atualize o tempo para criar o movimento de onda contínuo
        time += animationSpeed;

        // Solicite o próximo quadro de animação
        requestAnimationFrame(animateLogos);
      };

      animateLogos(); // Inicie a animação
    });
  }

  private animate() {
    // Função de atualização para animar as logos
    const animateLogos = () => {
      for (const logo of this.logos) {
        logo.model.rotation.y += 0.01; // Rode a logo em torno do eixo Y ainda mais devagar
      }

      // Solicite o próximo quadro de animação
      requestAnimationFrame(animateLogos);
    };

    animateLogos(); // Inicie a animação
  }

  private changeColors() {
    const color1 = 0x000000; // pre-estabelecido = Math.random() * 0xffffff
    const color2 = 0xFFF1F1; // pre-estabelecido = Math.random() * 0xffffff
    const backgroundColor = new THREE.Color(0x000000); // Substitua pela cor desejada
    this.bg.three.scene.background = backgroundColor; 
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
