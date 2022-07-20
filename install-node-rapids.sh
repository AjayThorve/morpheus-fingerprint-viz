#!/usr/bin/env -S bash -Eeo pipefail
REPO=ghcr.io/rapidsai/node
VERSIONS="22.06.00-devel-node16.15.1-cuda11.6.2-ubuntu20.04"

rm -rf rapidsai node_modules/{wrtc,@rapidsai}

mkdir -p rapidsai node_modules/@rapidsai

docker pull $REPO:$VERSIONS-packages

docker run --rm -v "$PWD/rapidsai:/out" \
    $REPO:$VERSIONS-packages \
    sh -c "cp \
        /opt/rapids/rapidsai-core-*.tgz      \
        /opt/rapids/rapidsai-cuda-*.tgz      \
        /opt/rapids/rapidsai-webgl-*.tgz     \
        /opt/rapids/rapidsai-rmm-*.tgz       \
        /opt/rapids/rapidsai-cudf-*.tgz      \
        /opt/rapids/rapidsai-deck.gl-*.tgz   \
        /out/"

# chown $(id -u):$(id -g) rapidsai/*.tgz

cd rapidsai

npm init --yes
npm install --save --production --omit dev --omit peer --omit optional --legacy-peer-deps --force *.tgz
rm package.json *.tgz

cd - 2>&1>/dev/null

ln -s "$PWD/rapidsai/node_modules/@rapidsai/core" node_modules/@rapidsai/core
ln -s "$PWD/rapidsai/node_modules/@rapidsai/cuda" node_modules/@rapidsai/cuda
ln -s "$PWD/rapidsai/node_modules/@rapidsai/webgl" node_modules/@rapidsai/webgl
ln -s "$PWD/rapidsai/node_modules/@rapidsai/rmm" node_modules/@rapidsai/rmm
ln -s "$PWD/rapidsai/node_modules/@rapidsai/cudf" node_modules/@rapidsai/cudf
ln -s "$PWD/rapidsai/node_modules/@rapidsai/deck.gl" node_modules/@rapidsai/deck.gl
ln -s "$PWD/rapidsai/node_modules/apache-arrow" node_modules/@rapidsai/apache-arrow