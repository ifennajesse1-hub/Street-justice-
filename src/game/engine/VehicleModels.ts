import * as THREE from 'three';

export interface VehicleRig {
  root: THREE.Group;
  wheels: THREE.Mesh[];
  frontLeftWheel: THREE.Group;
  frontRightWheel: THREE.Group;
  redSirenLight?: THREE.Mesh;
  blueSirenLight?: THREE.Mesh;
  headlights?: THREE.Mesh[];
  type: 'police' | 'criminal' | 'civilian' | 'armored';
}

/**
 * Builds smooth, aerodynamic modern low-poly 3D vehicles with realistic proportions,
 * sculpted chassis, curved wheel arches, realistic alloy wheels, and animated lighting.
 */
export function createVehicleMesh(
  type: 'police' | 'criminal' | 'civilian' | 'armored',
  customColor?: string
): VehicleRig {
  const root = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  // Vehicle Dimensions (realistic sedan / interceptor proportions)
  const isArmored = type === 'armored';
  const carWidth = isArmored ? 2.4 : 1.95;
  const carLength = isArmored ? 5.2 : 4.6;
  const carHeight = isArmored ? 1.7 : 1.25;

  // Color Palette
  let primaryColor = 0xffffff;
  let secondaryColor = 0x0f172a;

  if (type === 'police') {
    primaryColor = 0xf8fafc; // Clean pursuit white
    secondaryColor = 0x0f172a; // Deep midnight navy police doors/roof
  } else if (type === 'criminal') {
    primaryColor = 0x18181b; // Matte raven black muscle
    secondaryColor = 0xdc2626; // Crimson racing accents
  } else if (type === 'armored') {
    primaryColor = 0x1e293b; // Tactical slate SWAT
    secondaryColor = 0x0f172a;
  } else {
    // Civilian modern cars
    const civColors = [0x2563eb, 0xd97706, 0x16a34a, 0x9333ea, 0x475569, 0x0284c7, 0xe11d48, 0x64748b];
    primaryColor = customColor
      ? parseInt(customColor.replace('#', '0x'))
      : civColors[Math.floor(Math.random() * civColors.length)];
    secondaryColor = primaryColor;
  }

  // PBR Materials
  const matBody = new THREE.MeshStandardMaterial({
    color: primaryColor,
    roughness: 0.3,
    metalness: 0.55,
  });

  const matTrim = new THREE.MeshStandardMaterial({
    color: secondaryColor,
    roughness: 0.4,
    metalness: 0.45,
  });

  const matDarkTrim = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.8,
    metalness: 0.2,
  });

  const matGlass = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.08,
    metalness: 0.95,
    transparent: true,
    opacity: 0.88,
  });

  const matChrome = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.95,
    roughness: 0.15,
  });

  const matTire = new THREE.MeshStandardMaterial({
    color: 0x171717,
    roughness: 0.85,
  });

  const matRim = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.9,
    roughness: 0.2,
  });

  const matHeadlight = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xbae6fd,
    emissiveIntensity: 0.8,
    roughness: 0.1,
  });

  const matTaillight = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 0.6,
  });

  // 1. MAIN LOWER CHASSIS (Sculpted with beveled nose, rocker panels and rear bumper)
  const chassisGroup = new THREE.Group();

  // Central lower body
  const mainChassisGeom = new THREE.BoxGeometry(carWidth, carHeight * 0.42, carLength * 0.92);
  const mainChassis = new THREE.Mesh(mainChassisGeom, matBody);
  mainChassis.position.y = 0.52;
  mainChassis.castShadow = true;
  mainChassis.receiveShadow = true;
  chassisGroup.add(mainChassis);

  // Sloping Hood / Front Nose (tapered front wedge)
  const hoodLength = carLength * 0.32;
  const hoodGeom = new THREE.CylinderGeometry(carWidth * 0.48, carWidth * 0.50, hoodLength, 4);
  hoodGeom.rotateX(Math.PI / 2);
  hoodGeom.scale(1.0, 0.34, 1.0);
  const hood = new THREE.Mesh(hoodGeom, matBody);
  hood.position.set(0, 0.62, hoodLength * 0.85);
  hood.castShadow = true;
  chassisGroup.add(hood);

  // Recessed Front Grille
  const grilleGeom = new THREE.BoxGeometry(carWidth * 0.72, carHeight * 0.20, 0.08);
  const grille = new THREE.Mesh(grilleGeom, matDarkTrim);
  grille.position.set(0, 0.46, carLength * 0.47);
  chassisGroup.add(grille);

  // Front Curved Headlights
  const headlightL = new THREE.Mesh(new THREE.BoxGeometry(carWidth * 0.22, carHeight * 0.12, 0.1), matHeadlight);
  headlightL.position.set(-carWidth * 0.35, 0.56, carLength * 0.47);
  chassisGroup.add(headlightL);

  const headlightR = new THREE.Mesh(new THREE.BoxGeometry(carWidth * 0.22, carHeight * 0.12, 0.1), matHeadlight);
  headlightR.position.set(carWidth * 0.35, 0.56, carLength * 0.47);
  chassisGroup.add(headlightR);

  // Police Push-Bumper (Steel Ram Bar)
  if (type === 'police' || type === 'armored') {
    const pushBarGeom = new THREE.BoxGeometry(carWidth * 0.65, 0.08, 0.08);
    const pushBar = new THREE.Mesh(pushBarGeom, matDarkTrim);
    pushBar.position.set(0, 0.48, carLength * 0.51);
    chassisGroup.add(pushBar);

    [-0.24, 0.24].forEach((bx) => {
      const vertGeom = new THREE.BoxGeometry(0.08, 0.38, 0.08);
      const vert = new THREE.Mesh(vertGeom, matDarkTrim);
      vert.position.set(bx, 0.48, carLength * 0.51);
      chassisGroup.add(vert);
    });
  }

  // Rear LED Taillight Bar
  const taillightGeom = new THREE.BoxGeometry(carWidth * 0.82, carHeight * 0.12, 0.08);
  const taillight = new THREE.Mesh(taillightGeom, matTaillight);
  taillight.position.set(0, 0.58, -carLength * 0.46);
  chassisGroup.add(taillight);

  // Dual Chrome Exhaust Pipes
  [-0.42, 0.42].forEach((exX) => {
    const exhaustGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.18, 12);
    exhaustGeom.rotateX(Math.PI / 2);
    const exhaust = new THREE.Mesh(exhaustGeom, matChrome);
    exhaust.position.set(exX, 0.32, -carLength * 0.47);
    chassisGroup.add(exhaust);
  });

  // Criminal Muscle Car: Hood Air Scoops & Rear Deck Spoiler
  if (type === 'criminal') {
    [-0.25, 0.25].forEach((sx) => {
      const scoopGeom = new THREE.BoxGeometry(0.18, 0.06, 0.45);
      const scoop = new THREE.Mesh(scoopGeom, matTrim);
      scoop.position.set(sx, 0.72, 0.85);
      chassisGroup.add(scoop);
    });

    // Rear Spoiler
    const wingGeom = new THREE.BoxGeometry(carWidth * 0.95, 0.05, 0.32);
    const wing = new THREE.Mesh(wingGeom, matTrim);
    wing.position.set(0, 0.88, -carLength * 0.40);
    chassisGroup.add(wing);

    [-0.55, 0.55].forEach((wx) => {
      const strutGeom = new THREE.BoxGeometry(0.05, 0.20, 0.15);
      const strut = new THREE.Mesh(strutGeom, matDarkTrim);
      strut.position.set(wx, 0.76, -carLength * 0.40);
      chassisGroup.add(strut);
    });
  }

  // 2. AERODYNAMIC CABIN / GREENHOUSE (Raked windshield, roof, and flush glass windows)
  const cabinLength = carLength * (isArmored ? 0.75 : 0.54);
  const cabinWidth = carWidth * 0.86;
  const cabinHeight = carHeight * 0.50;

  const cabinGroup = new THREE.Group();
  cabinGroup.position.set(0, 0.52 + carHeight * 0.38, -0.15);

  // Tapered cabin roof
  const roofGeom = new THREE.CylinderGeometry(cabinWidth * 0.46, cabinWidth * 0.50, cabinLength, 4);
  roofGeom.rotateX(Math.PI / 2);
  roofGeom.scale(1.0, 0.55, 1.0);
  const roof = new THREE.Mesh(roofGeom, type === 'police' ? matTrim : matBody);
  roof.castShadow = true;
  cabinGroup.add(roof);

  // Raked Glass Windshield & Windows
  const windowGeom = new THREE.CylinderGeometry(cabinWidth * 0.44, cabinWidth * 0.48, cabinLength * 0.94, 4);
  windowGeom.rotateX(Math.PI / 2);
  windowGeom.scale(1.0, 0.52, 1.0);
  const windowMesh = new THREE.Mesh(windowGeom, matGlass);
  cabinGroup.add(windowMesh);

  // Aerodynamic Side Mirrors
  [-cabinWidth * 0.54, cabinWidth * 0.54].forEach((mx) => {
    const mirrorGeom = new THREE.BoxGeometry(0.12, 0.08, 0.16);
    const mirror = new THREE.Mesh(mirrorGeom, matDarkTrim);
    mirror.position.set(mx, 0.02, cabinLength * 0.35);
    cabinGroup.add(mirror);
  });

  chassisGroup.add(cabinGroup);

  // 3. POLICE PURSUIT ROOF LIGHTBAR (Aerodynamic dual-colored emergency strobe bar)
  let redSirenLight: THREE.Mesh | undefined;
  let blueSirenLight: THREE.Mesh | undefined;

  if (type === 'police') {
    const lightbarBase = new THREE.Mesh(new THREE.BoxGeometry(carWidth * 0.75, 0.04, 0.18), matChrome);
    lightbarBase.position.set(0, 1.14, -0.18);
    chassisGroup.add(lightbarBase);

    // Left Red Strobe Lens
    const redMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    redSirenLight = new THREE.Mesh(new THREE.BoxGeometry(carWidth * 0.32, 0.08, 0.16), redMat);
    redSirenLight.position.set(-carWidth * 0.19, 1.20, -0.18);
    chassisGroup.add(redSirenLight);

    // Right Blue Strobe Lens
    const blueMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    blueSirenLight = new THREE.Mesh(new THREE.BoxGeometry(carWidth * 0.32, 0.08, 0.16), blueMat);
    blueSirenLight.position.set(carWidth * 0.19, 1.20, -0.18);
    chassisGroup.add(blueSirenLight);

    // Center Chrome/Amber Accent Pod
    const centerPod = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.16), matChrome);
    centerPod.position.set(0, 1.20, -0.18);
    chassisGroup.add(centerPod);
  }

  root.add(chassisGroup);

  // 4. WHEELS & ALLOY RIMS (Smooth rounded rubber tires with multi-spoke alloy wheels)
  const wheelRadius = isArmored ? 0.42 : 0.34;
  const wheelWidth = isArmored ? 0.28 : 0.22;
  const wheelY = wheelRadius;
  const wheelOffsetX = carWidth * 0.50;
  const wheelOffsetZFront = carLength * 0.32;
  const wheelOffsetZRear = -carLength * 0.30;

  const createWheel = () => {
    const wheelGroup = new THREE.Group();

    // Smooth rounded rubber tire (20 segments with smooth normals)
    const tireGeom = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 20);
    tireGeom.rotateZ(Math.PI / 2);
    tireGeom.computeVertexNormals();
    const tire = new THREE.Mesh(tireGeom, matTire);
    tire.castShadow = true;
    wheelGroup.add(tire);
    wheels.push(tire);

    // Multi-spoke alloy rim
    const rimGeom = new THREE.CylinderGeometry(wheelRadius * 0.68, wheelRadius * 0.68, wheelWidth * 1.02, 12);
    rimGeom.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeom, matRim);
    wheelGroup.add(rim);

    // Chrome center hub
    const hubGeom = new THREE.CylinderGeometry(wheelRadius * 0.22, wheelRadius * 0.22, wheelWidth * 1.05, 8);
    hubGeom.rotateZ(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeom, matChrome);
    wheelGroup.add(hub);

    return wheelGroup;
  };

  // Front Left Wheel
  const frontLeftWheel = createWheel();
  frontLeftWheel.position.set(-wheelOffsetX, wheelY, wheelOffsetZFront);
  root.add(frontLeftWheel);

  // Front Right Wheel
  const frontRightWheel = createWheel();
  frontRightWheel.position.set(wheelOffsetX, wheelY, wheelOffsetZFront);
  root.add(frontRightWheel);

  // Rear Left Wheel
  const rearLeftWheel = createWheel();
  rearLeftWheel.position.set(-wheelOffsetX, wheelY, wheelOffsetZRear);
  root.add(rearLeftWheel);

  // Rear Right Wheel
  const rearRightWheel = createWheel();
  rearRightWheel.position.set(wheelOffsetX, wheelY, wheelOffsetZRear);
  root.add(rearRightWheel);

  return {
    root,
    wheels,
    frontLeftWheel,
    frontRightWheel,
    redSirenLight,
    blueSirenLight,
    headlights: [headlightL, headlightR],
    type,
  };
}

/**
 * Animate wheels, steering orientation, and police emergency strobe sequence
 */
export function updateVehicleAnimation(
  rig: VehicleRig,
  speed: number,
  steeringAngle: number,
  time: number,
  isSirenOn: boolean
) {
  // Steer front wheels
  rig.frontLeftWheel.rotation.y = steeringAngle;
  rig.frontRightWheel.rotation.y = steeringAngle;

  // Spin wheels based on velocity
  const wheelSpin = speed * 0.22;
  rig.wheels.forEach((w) => {
    w.rotation.x += wheelSpin;
  });

  // Emergency Siren Flashing Animation
  if (isSirenOn && rig.redSirenLight && rig.blueSirenLight) {
    const flash = Math.sin(time * 18) > 0;
    (rig.redSirenLight.material as THREE.MeshBasicMaterial).color.setHex(flash ? 0xff2222 : 0x450a0a);
    (rig.blueSirenLight.material as THREE.MeshBasicMaterial).color.setHex(!flash ? 0x3b82f6 : 0x172554);
  } else if (rig.redSirenLight && rig.blueSirenLight) {
    (rig.redSirenLight.material as THREE.MeshBasicMaterial).color.setHex(0x551111);
    (rig.blueSirenLight.material as THREE.MeshBasicMaterial).color.setHex(0x112255);
  }
}
