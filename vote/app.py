from flask import Flask, render_template, request, make_response
import os
import json
import redis
import uuid

app = Flask(_name_)
cache = redis.Redis(host='redis', port=6379)

@app.route('/', methods=['GET', 'POST'])
def index():
    voter_id = request.cookies.get('voter_id')
    if not voter_id:
        voter_id = str(uuid.uuid4())
    
    if request.method == 'POST':
        vote = request.form['vote']
        data = json.dumps({'voter_id': voter_id, 'vote': vote})
        cache.rpush('votes', data)
        resp = make_response(render_template('index.html', 
                                           option_a="Cats", option_b="Dogs",
                                           vote=vote))
        resp.set_cookie('voter_id', voter_id)
        return resp
    return render_template('index.html', option_a="Cats", option_b="Dogs")

if _name_ == '_main_':
    app.run(host='0.0.0.0', port=80)
