const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.get('/sync', async (req, res) => {
    try {
        const { data, error } = await supabase.from('db_state').select('*').eq('id', 1).single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/sync', async (req, res) => {
    try {
        const { users, content, lectii, docs, resp, home, proiecte, history } = req.body;
        
        const updateData = {};
        if (users !== undefined) updateData.users = users;
        if (content !== undefined) updateData.content = content;
        if (lectii !== undefined) updateData.lectii = lectii;
        if (docs !== undefined) updateData.docs = docs;
        if (resp !== undefined) updateData.resp = resp;
        if (home !== undefined) updateData.home = home;
        if (proiecte !== undefined) updateData.proiecte = proiecte;
        if (history !== undefined) updateData.history = history;

        const { error } = await supabase.from('db_state').update(updateData).eq('id', 1);
        if (error) throw error;
        
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { password } = req.body;
        if (password === "R8R") return res.json({ role: "Admin" });
        
        const { data, error } = await supabase.from('db_state').select('users').eq('id', 1).single();
        if (error) throw error;
        
        const user = (data.users || []).find(u => u.pass === password);
        if (user) res.json({ role: user.role });
        else res.status(401).send("Acces refuzat");
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/notify', async (req, res) => {
    try {
        const { title, message } = req.body;
        if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_REST_KEY) {
            return res.status(400).json({ error: "OneSignal keys missing" });
        }
        
        const response = await fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": `Basic ${process.env.ONESIGNAL_REST_KEY}`
            },
            body: JSON.stringify({
                app_id: process.env.ONESIGNAL_APP_ID,
                included_segments: ["Subscribed Users"],
                headings: { en: title, ro: title },
                contents: { en: message, ro: message },
                chrome_web_icon: "https://clasa6c.netlify.app/favicon.ico", 
                firefox_icon: "https://clasa6c.netlify.app/favicon.ico"
            })
        });
        
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(process.env.PORT || 3000, () => console.log("Server pornit!"));