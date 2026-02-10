# About Content Update Examples

## JSON Format Examples

### Update All Content (JSON)
```bash
curl -X PUT \
  http://localhost:5000/api/admin/banners/about/FREE/content \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "primaryTitle": "New Primary Title",
    "primaryDescription": "Updated description...",
    "secondaryTitle": "New Secondary Title",
    "cards": [
      {
        "heading": "Card 1 Heading",
        "description": "Card 1 Description"
      },
      {
        "heading": "Card 2 Heading",
        "description": "Card 2 Description"
      }
    ]
  }'
```

### Update Only Primary Title (JSON)
```bash
curl -X PUT \
  http://localhost:5000/api/admin/banners/about/FREE/content \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "primaryTitle": "Updated Title Only"
  }'
```

### Update Specific Card (JSON)
```bash
curl -X PUT \
  http://localhost:5000/api/admin/banners/about/FREE/cards/0 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "heading": "Updated Card Heading",
    "description": "Updated Card Description"
  }'
```

## Form-Data Format Examples

### Update All Content (Form-Data)
```bash
curl -X PUT \
  http://localhost:5000/api/admin/banners/about/FREE/content \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "primaryTitle=New Primary Title" \
  -F "primaryDescription=Updated description..." \
  -F "secondaryTitle=New Secondary Title" \
  -F "cards[0][heading]=Card 1 Heading" \
  -F "cards[0][description]=Card 1 Description" \
  -F "cards[1][heading]=Card 2 Heading" \
  -F "cards[1][description]=Card 2 Description"
```

### Update Only Primary Title (Form-Data)
```bash
curl -X PUT \
  http://localhost:5000/api/admin/banners/about/FREE/content \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "primaryTitle=Updated Title Only"
```

### Update Specific Card (Form-Data)
```bash
curl -X PUT \
  http://localhost:5000/api/admin/banners/about/FREE/cards/0 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "heading=Updated Card Heading" \
  -F "description=Updated Card Description"
```

### Update Only Card Description (Form-Data)
```bash
curl -X PUT \
  http://localhost:5000/api/admin/banners/about/FREE/cards/1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "description=Updated description only"
```

## JavaScript/Fetch Examples

### JSON Format
```javascript
// Update all content
fetch('http://localhost:5000/api/admin/banners/about/FREE/content', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    primaryTitle: "New Title",
    primaryDescription: "New description...",
    secondaryTitle: "New secondary title",
    cards: [
      {
        heading: "Card Heading",
        description: "Card Description"
      }
    ]
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

### Form-Data Format
```javascript
// Update all content with form-data
const formData = new FormData();
formData.append('primaryTitle', 'New Title');
formData.append('primaryDescription', 'New description...');
formData.append('secondaryTitle', 'New secondary title');
formData.append('cards[0][heading]', 'Card Heading');
formData.append('cards[0][description]', 'Card Description');

fetch('http://localhost:5000/api/admin/banners/about/FREE/content', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

## Axios Examples

### JSON Format
```javascript
const axios = require('axios');

// Update specific card
axios.put('http://localhost:5000/api/admin/banners/about/FREE/cards/0', {
  heading: "Updated Heading",
  description: "Updated Description"
}, {
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN',
    'Content-Type': 'application/json'
  }
})
.then(response => console.log(response.data))
.catch(error => console.error(error.response.data));
```

### Form-Data Format
```javascript
const axios = require('axios');
const FormData = require('form-data');

// Update content with form-data
const form = new FormData();
form.append('primaryTitle', 'New Title');
form.append('primaryDescription', 'New Description');

axios.put('http://localhost:5000/api/admin/banners/about/FREE/content', form, {
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN',
    ...form.getHeaders()
  }
})
.then(response => console.log(response.data))
.catch(error => console.error(error.response.data));
```

## Key Points

1. **Both formats are supported** - Choose based on your frontend implementation
2. **Same validation rules apply** to both JSON and form-data
3. **Partial updates work** with both formats
4. **Card arrays** in form-data use indexed notation: `cards[0][heading]`, `cards[0][description]`
5. **Authentication is required** for all endpoints
6. **Error responses** are consistent regardless of content type