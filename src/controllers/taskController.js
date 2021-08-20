const express = require('express');
const httpError = require('http-errors');
const Task = require('../models/taskModel');
const router = new express.Router();

router.post('/', async (req, res, next) => {
  const task = new Task(req.body);

  try {
    await task.save();
    res.status(201).send({ status: 'success', data: task });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const match = {}
    const sort = {}

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    await req.user.populate({
      path: 'tasks',
      match,
      options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort
      }
  }).execPopulate()
    res.send({ status: 'success', data: req.query.tasks });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const _id = req.params.id;
    const task = await Task.findById(_id);

    if (!task) {
      throw httpError.NotFound();
    }

    res.send({ status: 'success', data: tasks });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['description', 'completed'];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    throw httpError.NotAcceptable('Invalid updates!');
  }

  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!task) {
      throw httpError.NotFound();
    }

    res.send({ status: 'success', data: tasks });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      throw httpError.NotFound();
    }

    res.send({ status: 'success', data: tasks });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
