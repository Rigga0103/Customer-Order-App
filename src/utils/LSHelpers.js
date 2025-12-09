
export const LS = {
    get(key) { return JSON.parse(localStorage.getItem(key) || '[]'); },
    set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
};

export const seedData = {
    ri_users: [
        { id: "admin", name: "Admin", role: "admin", password: "admin123" },
        { id: "user", name: "Mr Customer", role: "customer", password: "user123" }
    ],
    ri_products: [],
    ri_schemes: [
        { scheme_id: "S01", name: "Festive 10%", discountPercent: 10, validFrom: "2025-12-01", validTo: "2026-01-10", product_ids: ["P001", "P002", "P003", "P004", "P005"] }
    ],
    ri_orders: [
        {
            order_id: "O1001",
            customer_id: "user",
            product_id: "P001",
            quantity: 2,
            amount: 240,
            address: "123, Example Street",
            paymentType: "COD",
            scheme_id: "S01",
            status: "PENDING",
            createdAt: "2025-12-09T11:00:00Z",
            history: [
                { status: "PENDING", at: "2025-12-09T11:00:00Z", by: "user" }
            ],
            dispatchInfo: null,
            deliveryInfo: null
        }
    ],
    ri_complaints: [
        {
            complaint_id: "C5001",
            customer_id: "user",
            product_id: "P001",
            description: "Leaking bottle",
            images: [],
            status: "PENDING",
            createdAt: "2025-12-08T10:00:00Z",
            history: [{ status: "PENDING", at: "2025-12-08T10:00:00Z" }]
        }
    ],
    ri_targets: [
        { month: "2025-12", user_id: "user", target: 10000, achieved: 240 }
    ]
};

// Generate Products (Specific Electrical + Random)
const electricalProducts = [
    { product_id: 'P001', name: 'Industrial wire red (90m)', price: 1200, category: 'Electrical', image: 'https://placehold.co/300x300/e63946/white?text=Red+Wire', launchDate: '2025-01-01' },
    { product_id: 'P002', name: 'Modular Switch Board (8M)', price: 850, category: 'Electrical', image: 'https://placehold.co/300x300/f1faee/e63946?text=Switch+Board', launchDate: '2025-01-01' },
    { product_id: 'P003', name: 'LED Bulb 9W (Pack of 10)', price: 900, category: 'Lighting', image: 'https://placehold.co/300x300/ffb703/000000?text=LED+Bulbs', launchDate: '2025-01-01' },
    { product_id: 'P004', name: 'Ceiling Fan High Speed', price: 2400, category: 'Electrical', image: 'https://placehold.co/300x300/457b9d/white?text=Ceiling+Fan', launchDate: '2025-01-01' },
    { product_id: 'P005', name: 'MCB Double Pole 63A', price: 450, category: 'Electrical', image: 'https://placehold.co/300x300/1d3557/white?text=MCB+63A', launchDate: '2025-12-08' },
    { product_id: 'P006', name: 'PVC Conduit Pipe 25mm', price: 180, category: 'Hardware', image: 'https://placehold.co/300x300/ADB5BD/000000?text=PVC+Pipe', launchDate: '2025-12-08' },
    { product_id: 'P007', name: 'Electrical Tape (Set of 5)', price: 150, category: 'Accessories', image: 'https://placehold.co/300x300/000000/white?text=Insulation+Tape', launchDate: '2025-12-09' }
];

electricalProducts.forEach(p => seedData.ri_products.push(p));

// Fill rest up to 100
// Fill rest up to 100 with ELECTRICAL items
const electricalItems = [
    'Circuit Breaker', 'Distribution Box', 'Power Socket', 'Wall Switch',
    'Fuses Pack', 'Cables Bundle', 'Multimeter', 'Soldering Iron',
    'Extension Board', 'Voltage Stabilizer', 'Inverter Battery', 'Transformer',
    'Relay Module', 'Capacitor Set', 'Resistor Kit', 'Diode Pack',
    'LED Strip Light', 'Tube Light', 'Ceiling Rose', 'Conduit Pipe'
];

const colors = ['e63946', 'f1faee', 'a8dadc', '457b9d', '1d3557', 'ef233c', '2b2d42', '8d99ae'];

for (let i = 8; i <= 30; i++) {
    const pad = i.toString().padStart(3, '0');
    const name = electricalItems[i % electricalItems.length] + ' ' + (Math.floor(Math.random() * 100) + 100);
    const bg = colors[i % colors.length];
    const fg = bg === 'f1faee' ? '1d3557' : 'white';

    seedData.ri_products.push({
        product_id: `P${pad}`,
        name: name,
        price: (Math.floor(Math.random() * 50) + 5) * 10,
        category: 'Electrical',
        image: `https://placehold.co/400/${bg}/${fg}?text=${encodeURIComponent(name.split(' ')[0])}`,
        launchDate: i > 25 ? "2025-12-05" : "2025-01-01"
    });
}

export function seedLocalStorage() {
    const products = localStorage.getItem('ri_products');
    // Force reset if old generic data exists (Checking "Product 8" as a reliable indicator of old data) or if empty
    if (!products || products.includes('Product 8 - ')) {
        console.log("Reseeding data...");
        Object.keys(seedData).forEach(k => localStorage.setItem(k, JSON.stringify(seedData[k])));
        window.location.reload();
    }
}

export function notifyDataChange() { window.dispatchEvent(new Event('ri_data_changed')); }

export function createOrder(orderObject) {
    const orders = LS.get('ri_orders');
    orders.unshift(orderObject);
    LS.set('ri_orders', orders);
    // Update target achieved?
    /* 
       Ideally we would update ri_targets here too, but the plan only says 
       "All CRUD changes persist to localStorage". 
       The Dashboard computes balance from ri_targets. 
       If we want the 'achieved' to update, we should do it here or calculate dynamic property.
       For now, let's keep it simple as confirmed in plan.
    */
    notifyDataChange();
}

export function updateOrderStatus(order_id, newStatus, meta = {}) {
    const orders = LS.get('ri_orders');
    const idx = orders.findIndex(o => o.order_id === order_id);
    if (idx === -1) throw new Error('Order not found');
    orders[idx].status = newStatus;
    orders[idx].history.push({ status: newStatus, at: new Date().toISOString(), ...meta });
    LS.set('ri_orders', orders);
    notifyDataChange();
}

export function createComplaint(c) {
    const arr = LS.get('ri_complaints');
    arr.unshift(c);
    LS.set('ri_complaints', arr);
    notifyDataChange();
}

export function updateComplaintStatus(complaint_id, newStatus, meta = {}) {
    const arr = LS.get('ri_complaints');
    const i = arr.findIndex(x => x.complaint_id === complaint_id);
    if (i === -1) return;
    arr[i].status = newStatus;
    arr[i].history.push({ status: newStatus, at: new Date().toISOString(), ...meta });
    LS.set('ri_complaints', arr);
    notifyDataChange();
}

export function getNotTriedProducts(customer_id) {
    const all = LS.get('ri_products');
    const orders = LS.get('ri_orders').filter(o => o.customer_id === customer_id);
    const boughtIds = new Set(orders.map(o => o.product_id));
    return all.filter(p => !boughtIds.has(p.product_id));
}
