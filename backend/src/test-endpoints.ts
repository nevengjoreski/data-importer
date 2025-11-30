const API_URL = 'http://localhost:4000/api/import';

async function testEndpoints() {
    console.log('Testing endpoints...');

    // Test Enterprise Batch
    try {
        console.log('Testing /enterprise-batch...');
        const resBatch = await fetch(`${API_URL}/enterprise-batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const dataBatch = await resBatch.json();
        console.log('Batch Response:', dataBatch);
    } catch (error) {
        console.error('Batch Error:', error);
    }

    // Test Enterprise Stream
    try {
        console.log('Testing /enterprise-stream...');
        const resStream = await fetch(`${API_URL}/enterprise-stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const dataStream = await resStream.json();
        console.log('Stream Response:', dataStream);
    } catch (error) {
        console.error('Stream Error:', error);
    }
}

testEndpoints();
