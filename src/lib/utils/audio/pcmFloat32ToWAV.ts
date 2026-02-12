export function pcmFloat32ToWAV(audioBuffer: AudioBuffer): ArrayBuffer {
    const numChannels = audioBuffer.numberOfChannels;
    const numSamples = audioBuffer.length;
    const numBitsPerSample = 16;
    const dataChunkSize = (numSamples * numChannels * numBitsPerSample) / 8;
    const sampleRate = audioBuffer.sampleRate;

    const arrayBuffer = new ArrayBuffer(44 + dataChunkSize);
    const dataView = new DataView(arrayBuffer);

    let byteOffset = 0;

    function writeString(s: string) {
        for (let i = 0; i < s.length; i++, byteOffset++) {
            dataView.setUint8(byteOffset, s.charCodeAt(i));
        }
    }

    /** RIFF header */
    writeString("RIFF"); /* RIFF */

    dataView.setUint32(byteOffset, 36 + dataChunkSize, true); /* Chunk size */
    byteOffset += 4;

    writeString("WAVE"); /* Format */

    /** FMT */
    writeString("fmt "); /* Sub-chunk 1 ID */

    dataView.setUint32(byteOffset, 16, true); /* Sub-chunk 1 size */
    byteOffset += 4;

    /* Audio format */
    dataView.setUint16(byteOffset, 1, true);
    byteOffset += 2;

    /* Number of channels */
    dataView.setUint16(byteOffset, numChannels, true);
    byteOffset += 2;

    /* Sample rate */
    dataView.setUint32(byteOffset, sampleRate, true);
    byteOffset += 4;

    /* Byte rate */
    dataView.setUint32(byteOffset, (sampleRate * numChannels * numBitsPerSample) / 8, true);
    byteOffset += 4;

    /* Block align */
    dataView.setUint16(byteOffset, (numChannels * numBitsPerSample) / 8, true);
    byteOffset += 2;

    /* Number of bits per sample */
    dataView.setUint16(byteOffset, numBitsPerSample, true);
    byteOffset += 2;

    /** DATA */
    writeString("data"); /* Sub-chunk 2 ID */

    dataView.setUint32(byteOffset, dataChunkSize); /* Sub-chunk 2 size */
    byteOffset += 4;

    let channelOffset = 0;

    while (byteOffset < arrayBuffer.byteLength) {
        for (let i = 0; i < numChannels; i++) {
            const sampleValue = Math.max(-1, Math.min(1, audioBuffer.getChannelData(i)[channelOffset]));
            const int16SampleValue = Math.trunc(sampleValue < 0 ? sampleValue * 0x8000 : sampleValue * 0x7fff);
            dataView.setInt16(byteOffset, int16SampleValue, true);
            byteOffset += 2;
        }

        channelOffset++;
    }

    return arrayBuffer;
}
