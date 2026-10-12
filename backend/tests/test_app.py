"""
Tests for AI Coding Assistant Backend
"""
import pytest
import json
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import app, db, User, Conversation, Settings, RequestCounter


@pytest.fixture
def client():
    """Create test client with in-memory database."""
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            
            # Create test user
            user = User(
                id='test_usr_001',
                email='test@example.com',
                name='Test User',
                role='Tester',
                semester='Semester 1',
                project='Test Project'
            )
            user.set_password('testpass123')
            db.session.add(user)
            db.session.commit()
            
        yield client
        
        with app.app_context():
            db.drop_all()


@pytest.fixture
def auth_token(client):
    """Get auth token for test user."""
    response = client.post('/api/auth/login', 
        data=json.dumps({'email': 'test@example.com', 'password': 'testpass123'}),
        content_type='application/json')
    data = json.loads(response.data)
    return data.get('token')


class TestAuth:
    def test_register_success(self, client):
        response = client.post('/api/auth/register',
            data=json.dumps({
                'email': 'newuser@example.com',
                'password': 'newpass123',
                'name': 'New User'
            }),
            content_type='application/json')
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['success'] is True
        assert 'user' in data

    def test_register_duplicate_email(self, client):
        client.post('/api/auth/register',
            data=json.dumps({'email': 'dup@example.com', 'password': 'pass', 'name': 'User'}),
            content_type='application/json')
        response = client.post('/api/auth/register',
            data=json.dumps({'email': 'dup@example.com', 'password': 'pass', 'name': 'User'}),
            content_type='application/json')
        assert response.status_code == 400

    def test_login_success(self, client):
        response = client.post('/api/auth/login',
            data=json.dumps({'email': 'test@example.com', 'password': 'testpass123'}),
            content_type='application/json')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert 'token' in data

    def test_login_wrong_password(self, client):
        response = client.post('/api/auth/login',
            data=json.dumps({'email': 'test@example.com', 'password': 'wrongpass'}),
            content_type='application/json')
        assert response.status_code == 401

    def test_get_current_user(self, client, auth_token):
        response = client.get('/api/auth/me',
            headers={'Authorization': f'Bearer {auth_token}'})
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert data['user']['email'] == 'test@example.com'


class TestConversations:
    def test_get_conversations_empty(self, client, auth_token):
        response = client.get('/api/conversations',
            headers={'Authorization': f'Bearer {auth_token}'})
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert isinstance(data['conversations'], list)

    def test_create_conversation(self, client, auth_token):
        response = client.post('/api/conversations',
            data=json.dumps({
                'title': 'Test Conversation',
                'task': 'generate',
                'language': 'python',
                'instruction': 'Create a hello world',
                'code': 'print("Hello")'
            }),
            content_type='application/json',
            headers={'Authorization': f'Bearer {auth_token}'})
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['success'] is True
        assert data['conversation']['title'] == 'Test Conversation'

    def test_delete_conversation(self, client, auth_token):
        # Create first
        create_resp = client.post('/api/conversations',
            data=json.dumps({'title': 'To Delete', 'task': 'generate', 'language': 'python'}),
            content_type='application/json',
            headers={'Authorization': f'Bearer {auth_token}'})
        conv_id = json.loads(create_resp.data)['conversation']['id']
        
        # Delete
        response = client.delete(f'/api/conversations/{conv_id}',
            headers={'Authorization': f'Bearer {auth_token}'})
        assert response.status_code == 200


class TestAIEndpoints:
    def test_generate_code(self, client):
        response = client.post('/api/ai/generate',
            data=json.dumps({'language': 'python', 'instruction': 'Create a function'}),
            content_type='application/json')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert 'generated_code' in data

    def test_explain_code(self, client):
        response = client.post('/api/ai/explain',
            data=json.dumps({'language': 'python', 'code': 'def foo(): pass'}),
            content_type='application/json')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True

    def test_debug_code(self, client):
        response = client.post('/api/ai/debug',
            data=json.dumps({'language': 'python', 'code': 'def foo(): pass', 'error_message': 'Test error'}),
            content_type='application/json')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True

    def test_improve_code(self, client):
        response = client.post('/api/ai/improve',
            data=json.dumps({'language': 'python', 'code': 'def foo(): pass'}),
            content_type='application/json')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert 'improved_code' in data


class TestDashboard:
    def test_get_stats(self, client):
        response = client.get('/api/dashboard/stats')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert 'total_requests' in data


class TestSettings:
    def test_get_settings(self, client):
        response = client.get('/api/settings')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True

    def test_update_settings(self, client):
        response = client.put('/api/settings',
            data=json.dumps({'theme': 'light', 'mock_mode': 'true'}),
            content_type='application/json')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert data['settings']['theme'] == 'light'


if __name__ == '__main__':
    pytest.main([__file__, '-v'])