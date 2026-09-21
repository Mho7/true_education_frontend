import * as THREE from "three";
import { YEOWLI_VISUAL_CONFIG } from "./gameConfig";

/**
 * 여울이 GLB의 Material을 웹 렌더링 환경(Color Space / Tone Mapping / Lighting)에 맞게
 * 보정한다. Base Color(mat.color)는 절대 바꾸지 않고, texture colorSpace / roughness /
 * metalness / emissive / envMapIntensity만 조정해서 Blender 원본 색감은 유지한다.
 *
 * GLB를 clone한 직후 딱 1번만 호출해야 한다 (Player.tsx의 useMemo 안에서 호출됨).
 * 매 프레임/매 리렌더마다 부르면 material.clone()이 계속 쌓이므로 절대 useFrame이나
 * 컴포넌트 바디에서 직접 호출하지 말 것.
 */
export function tuneYeowliMaterials(model: THREE.Object3D): void {
  model.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    // SkinnedMesh도 Mesh를 상속하므로 여기서 함께 처리된다 (skinning/rigging은
    // geometry/skeleton 쪽 문제라 material 교체와는 무관해서 안전함).
    mesh.castShadow = true;
    mesh.receiveShadow = false;

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

    const tuned = materials.map((material) => {
      if (!material) return material;

      // clone해서 원본 GLB material/texture 자체는 보존한다 (이름도 그대로 유지됨).
      const mat = material.clone() as THREE.MeshStandardMaterial;

      if (mat.map) {
        mat.map.colorSpace = THREE.SRGBColorSpace;
        mat.map.needsUpdate = true;
      }

      if ("roughness" in mat) mat.roughness = YEOWLI_VISUAL_CONFIG.roughness;
      if ("metalness" in mat) mat.metalness = YEOWLI_VISUAL_CONFIG.metalness;
      if ("emissive" in mat) {
        mat.emissive.set(YEOWLI_VISUAL_CONFIG.emissiveColor);
        mat.emissiveIntensity = YEOWLI_VISUAL_CONFIG.emissiveIntensity;
      }
      if ("envMapIntensity" in mat) mat.envMapIntensity = YEOWLI_VISUAL_CONFIG.envMapIntensity;

      mat.needsUpdate = true;
      return mat;
    });

    mesh.material = Array.isArray(mesh.material) ? tuned : tuned[0];
  });
}
